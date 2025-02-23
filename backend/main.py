import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket
import logging
from fastapi.middleware.cors import CORSMiddleware
import pyaudio
import threading
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions
from datetime import datetime
import uvicorn
from typing import List

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Allow all origins (adjust in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Audio parameters
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000

# Global variables
recording = False
dg_connection = None
active_websockets: List[WebSocket] = []

# Initialize Deepgram
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
if not DEEPGRAM_API_KEY:
    raise EnvironmentError("Missing DEEPGRAM_API_KEY")

deepgram = DeepgramClient(DEEPGRAM_API_KEY)

async def broadcast_transcript(transcript_data: dict):
    """Send transcript to all connected websocket clients"""
    for websocket in active_websockets:
        try:
            await websocket.send_json(transcript_data)
        except:
            active_websockets.remove(websocket)

def on_transcript(connection, result):
    """Handle incoming transcripts"""
    alt = result.channel.alternatives[0]
    transcript = alt.transcript
    if not transcript:
        return

    # Get speaker info
    words = alt.words
    # Default to "Speaker 1" instead of "Unknown"
    speaker_str = f"Speaker {words[0].speaker}" if words and words[0].speaker else "Speaker 1"

    # Create record
    record = {
        "speaker": speaker_str,
        "transcript": transcript,
        "timestamp": datetime.utcnow().isoformat()
    }

    # Broadcast to all connected clients
    import asyncio
    asyncio.run(broadcast_transcript(record))

def record_audio():
    """Record audio from microphone and send to Deepgram"""
    global recording, dg_connection
    
    p = pyaudio.PyAudio()
    stream = p.open(
        format=FORMAT,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        frames_per_buffer=CHUNK
    )

    while recording:
        data = stream.read(CHUNK, exception_on_overflow=False)
        if dg_connection:
            dg_connection.send(data)

    stream.stop_stream()
    stream.close()
    p.terminate()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except:
        active_websockets.remove(websocket)

@app.post("/start")
async def start_recording():
    """Start recording and transcription"""
    global recording, dg_connection
    
    if recording:
        return {"message": "Already recording"}

    # Setup Deepgram connection
    dg_connection = deepgram.listen.websocket.v("1")
    dg_connection.on(LiveTranscriptionEvents.Transcript, on_transcript)

    options = LiveOptions(
        model="enhanced-meeting",
        diarize=True,
        encoding="linear16",
        sample_rate=RATE,
        channels=CHANNELS,
        punctuate=True,
    )

    # Start Deepgram connection
    if not dg_connection.start(options):
        raise HTTPException(status_code=500, detail="Failed to start Deepgram connection")

    # Start recording
    recording = True
    threading.Thread(target=record_audio, daemon=True).start()

    return {"message": "Recording started"}

@app.post("/stop")
async def stop_recording():
    """Stop recording and transcription"""
    global recording, dg_connection
    
    if not recording:
        return {"message": "Not recording"}

    recording = False
    if dg_connection:
        dg_connection.finish()
        dg_connection = None

    return {"message": "Recording stopped"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)