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
from typing import Optional, Set

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create routers
demo_router = APIRouter(prefix="/demo", tags=["demo"])
realtime_router = APIRouter(prefix="/real-time", tags=["real-time"])

# Environment variables
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

# PyAudio settings
CHUNK = 1024
RATE = 16000
CHANNELS = 1
FORMAT = pyaudio.paInt16

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
    allow_origins=["http://localhost:3000","http://localhost:3001" ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------
# Load the demo conversation
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
    """Return the pre-analyzed demo conversation"""
    if not DEMO_CONVERSATION:
        raise HTTPException(status_code=500, detail="No demo conversation data available")
    return DEMO_CONVERSATION

# -------------------
# Broadcasting Helper
# -------------------
async def broadcast_transcript(data: dict):
    """
    Sends transcript to all connected WebSocket clients as JSON text.
    """
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
    """
    Called each time Deepgram returns a transcript chunk.
    We track partial transcripts (alt.transcript) so that we only send
    the incremental difference in real time.
    """
    alt = result.channel.alternatives[0]
    transcript_text = alt.transcript
    if not transcript_text:
        return  # Skip empty transcripts

    # If using speaker diarization, alt.words might have speaker indices
    # We'll pick the first word's speaker if available
    speaker_label = "Unknown"
    if alt.words and alt.words[0].speaker is not None:
        speaker_label = f"Speaker {alt.words[0].speaker}"

    # Retrieve the last partial transcript for this speaker
    old_partial = speaker_partial.get(speaker_label, "")

    # Find the common prefix between old_partial and the new partial
    i = 0
    min_len = min(len(old_partial), len(transcript_text))
    while i < min_len and old_partial[i] == transcript_text[i]:
        i += 1

    # The new substring after the common prefix
    new_str = transcript_text[i:].strip()

    # If there's truly something new, broadcast it
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

        global loop
        if loop and loop.is_running():
            loop.call_soon_threadsafe(
                lambda: asyncio.create_task(broadcast_transcript(transcript_data))
            )

    # Update stored partial transcript for this speaker
    speaker_partial[speaker_label] = transcript_text

# -------------------
# Audio Thread
# -------------------
def audio_worker():
    """
    Audio capture and streaming to Deepgram.
    """
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
        # You can experiment with endpointing, multichannel, etc.
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
    """Start audio recording + transcription"""
    global audio_thread, speaker_partial
    if audio_thread and audio_thread.is_alive():
        return {"message": "Already recording"}

    # Clear partial transcripts from previous sessions
    speaker_partial.clear()

    stop_event.clear()
    audio_thread = threading.Thread(target=audio_worker, daemon=True)
    audio_thread.start()
    return {"message": "Recording started"}

@realtime_router.post("/stop")
async def stop_recording():
    """Stop audio recording + transcription"""
    global audio_thread
    if not audio_thread or not audio_thread.is_alive():
        return {"message": "Not currently recording"}

    stop_event.set()
    audio_thread.join()
    audio_thread = None
    return {"message": "Recording stopped"}

@realtime_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for clients to receive real-time transcripts.
    """
    await websocket.accept()
    connected_clients.add(websocket)
    logger.info(f"Client connected. Total clients: {len(connected_clients)}")

    try:
        while True:
            # We generally don't expect incoming messages,
            # but we must receive to keep the WS connection alive.
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
    """Health check endpoint"""
    return {"status": "ok"}

# Include routers
app.include_router(demo_router)
app.include_router(realtime_router)

@app.on_event("startup")
async def startup_event():
    """Capture reference to the main event loop."""
    global loop
    loop = asyncio.get_running_loop()

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server at http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
