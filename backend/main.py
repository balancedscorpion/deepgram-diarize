# main.py

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter
import logging
import json
import os
import threading
import asyncio
import pyaudio
from datetime import datetime
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions
from starlette.websockets import WebSocketState
from typing import Optional, Set, List

# Import the analysis functions & model
from analysis import TranscriptEntry, get_meeting_objective, get_speaker_sentiment

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

demo_router = APIRouter(prefix="/demo", tags=["demo"])
realtime_router = APIRouter(prefix="/real-time", tags=["real-time"])

# Environment variables
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

# PyAudio settings
CHUNK = 1024
RATE = 16000
CHANNELS = 1
FORMAT = pyaudio.paInt16

# In-memory transcript storage
TRANSCRIPT_MEMORY: List[TranscriptEntry] = []

# Global state
connected_clients: Set[WebSocket] = set()
stop_event = threading.Event()
audio_thread = None
loop = None

# Track partial transcripts so we can broadcast new text without repeating
speaker_partial = {}  # Maps speaker label -> last partial transcript text

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------
# Load the demo conversation (optional)
# -------------------
DEMO_CONVERSATION = []
try:
    current_dir = os.path.dirname(os.path.realpath(__file__))
    json_path = os.path.join(current_dir, "analyzed_conversation.json")
    with open(json_path, "r") as f:
        DEMO_CONVERSATION = json.load(f)
    logger.info(f"Loaded {len(DEMO_CONVERSATION)} demo messages")
except Exception as e:
    logger.error(f"Error loading demo conversation: {e}")

@demo_router.get("/conversation")
async def get_demo_conversation():
    if not DEMO_CONVERSATION:
        raise HTTPException(status_code=500, detail="No demo conversation data available")
    return DEMO_CONVERSATION

@demo_router.get("/transcript-memory")
async def get_transcript_memory():
    """
    Returns the current list of transcript entries from in-memory storage.
    """
    return TRANSCRIPT_MEMORY

# -------------------
# Objective Endpoint
# -------------------
@demo_router.get("/objective")
async def get_objective():
    """
    Return the LLM's textual response for the conversation objective.
    """
    llm_response = get_meeting_objective(TRANSCRIPT_MEMORY)
    return {"objective_response": llm_response}

# -------------------
# Sentiment Endpoint
# -------------------
@demo_router.get("/sentiment")
async def get_sentiment():
    """
    Return the LLM's textual response for the per-speaker sentiment analysis.
    """
    sentiment_response = get_speaker_sentiment(TRANSCRIPT_MEMORY)
    return {"sentiment_response": sentiment_response}

# -------------------
# Broadcasting Helper
# -------------------
async def broadcast_transcript(data: dict):
    payload = json.dumps(data)
    for ws in list(connected_clients):
        if ws.client_state == WebSocketState.CONNECTED:
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")

# -------------------
# Deepgram Callback
# -------------------
def on_transcript(connection, result, **kwargs):
    alt = result.channel.alternatives[0]
    transcript_text = alt.transcript
    if not transcript_text:
        return

    # Identify speaker if diarization is enabled
    speaker_label = "Unknown"
    if alt.words and alt.words[0].speaker is not None:
        speaker_label = f"Speaker {alt.words[0].speaker}"

    old_partial = speaker_partial.get(speaker_label, "")
    i = 0
    min_len = min(len(old_partial), len(transcript_text))
    while i < min_len and old_partial[i] == transcript_text[i]:
        i += 1
    new_str = transcript_text[i:].strip()

    if new_str:
        transcript_data = {
            "speaker": speaker_label,
            "name": speaker_label,
            "transcript": new_str,
            "timestamp": datetime.utcnow().isoformat(),
            "analysis": {
                "info_density": 0.5,
                "sentiment": 0.0,
                "controversial": False,
                "fallacies": []
            }
        }

        # --- Store new snippet ---
        TRANSCRIPT_MEMORY.append(
            TranscriptEntry(speaker=speaker_label, transcript=new_str)
        )

        # --- Call LLM for objective ---
        llm_objective = get_meeting_objective(TRANSCRIPT_MEMORY)
        logger.info(f"LLM objective response: {llm_objective}")

        # --- Call LLM for sentiment ---
        llm_sentiment = get_speaker_sentiment(TRANSCRIPT_MEMORY)
        logger.info(f"LLM speaker sentiment response: {llm_sentiment}")
        
        # Parse and update sentiment scores
        try:
            sentiment_data = json.loads(llm_sentiment)
            if isinstance(sentiment_data, list):
                for speaker_sentiment in sentiment_data:
                    if speaker_sentiment["Speaker"] == speaker_label:
                        transcript_data["analysis"]["sentiment"] = speaker_sentiment["Sentiment"]
                        break
        except Exception as e:
            logger.error(f"Error parsing sentiment response: {e}")

        # --- Broadcast only the new transcript ---
        global loop
        if loop and loop.is_running():
            loop.call_soon_threadsafe(
                lambda: asyncio.create_task(broadcast_transcript(transcript_data))
            )

    speaker_partial[speaker_label] = transcript_text

# -------------------
# Audio Thread
# -------------------
def audio_worker():
    logger.info("Audio worker starting...")

    dg = DeepgramClient(DEEPGRAM_API_KEY)
    dg_connection = dg.listen.websocket.v("1")
    dg_connection.on(LiveTranscriptionEvents.Transcript, on_transcript)

    options = LiveOptions(
        model="enhanced-meeting",
        encoding="linear16",
        sample_rate=RATE,
        channels=CHANNELS,
        punctuate=True,
        interim_results=True,
        diarize=True,
    )

    if not dg_connection.start(options):
        logger.error("Failed to start Deepgram connection")
        return

    p = pyaudio.PyAudio()
    stream = p.open(
        format=FORMAT,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        frames_per_buffer=CHUNK
    )

    logger.info("Recording started")

    try:
        while not stop_event.is_set():
            data = stream.read(CHUNK, exception_on_overflow=False)
            dg_connection.send(data)
    except Exception as e:
        logger.error(f"Audio worker error: {e}")
    finally:
        logger.info("Cleaning up audio worker...")
        dg_connection.finish()
        stream.stop_stream()
        stream.close()
        p.terminate()

# -------------------
# Real-time Routes
# -------------------
@realtime_router.post("/start")
async def start_recording():
    global audio_thread, speaker_partial, TRANSCRIPT_MEMORY
    if audio_thread and audio_thread.is_alive():
        return {"message": "Already recording"}

    # Reset partial transcripts & store
    speaker_partial.clear()
    TRANSCRIPT_MEMORY.clear()

    stop_event.clear()
    audio_thread = threading.Thread(target=audio_worker, daemon=True)
    audio_thread.start()
    return {"message": "Recording started"}

@realtime_router.post("/stop")
async def stop_recording():
    global audio_thread
    if not audio_thread or not audio_thread.is_alive():
        return {"message": "Not currently recording"}

    stop_event.set()
    audio_thread.join()
    audio_thread = None
    return {"message": "Recording stopped"}

@realtime_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    logger.info(f"Client connected. Total clients: {len(connected_clients)}")

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info("Client disconnected")
    finally:
        connected_clients.remove(websocket)
        logger.info(f"Client removed. Total clients: {len(connected_clients)}")

# -------------------
# Health Check
# -------------------
@app.get("/")
async def health_check():
    return {"status": "ok"}

# -------------------
# Include Routers & Startup
# -------------------
app.include_router(demo_router)
app.include_router(realtime_router)

@app.on_event("startup")
async def startup_event():
    global loop
    loop = asyncio.get_running_loop()

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server at http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
