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
from collections import defaultdict
import json

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
current_speaker = None
speaker_buffer = defaultdict(str)
last_speaker_time = defaultdict(float)
SPEAKER_TIMEOUT = 2.0  # seconds before considering it a new utterance

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
    global current_speaker
    
    alt = result.channel.alternatives[0]
    transcript = alt.transcript
    if not transcript:
        return

    # Get speaker info and normalize to Speaker 1, 2, etc.
    words = alt.words
    if words and words[0].speaker:
        raw_speaker = int(words[0].speaker)  # Deepgram returns "0", "1", etc.
        speaker_str = f"Speaker {raw_speaker + 1}"  # Convert to Speaker 1, 2, etc.
    else:
        speaker_str = "Speaker 1"  # Default to Speaker 1 if no speaker detected
    
    current_time = datetime.utcnow().timestamp()
    
    # If this is the same speaker and within timeout, append to buffer
    if (current_speaker == speaker_str and 
        current_time - last_speaker_time[speaker_str] < SPEAKER_TIMEOUT):
        speaker_buffer[speaker_str] += " " + transcript
        logger.debug(f"Appending to {speaker_str}'s buffer: {transcript}")
    else:
        # If we have a previous speaker's buffered message, send it first
        if current_speaker and speaker_buffer[current_speaker]:
            final_transcript = {
                "speaker": current_speaker,
                "transcript": speaker_buffer[current_speaker].strip(),
                "timestamp": datetime.utcnow().isoformat()
            }
            logger.info(f"Broadcasting buffered transcript: {json.dumps(final_transcript)}")
            import asyncio
            asyncio.run(broadcast_transcript(final_transcript))
            speaker_buffer[current_speaker] = ""
        
        # Start new buffer for current speaker
        current_speaker = speaker_str
        speaker_buffer[speaker_str] = transcript
        logger.debug(f"Starting new buffer for {speaker_str}: {transcript}")
    
    last_speaker_time[speaker_str] = current_time

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
    
    logger.info("Starting recording...")
    
    if recording:
        logger.warning("Already recording - ignoring start request")
        return {"message": "Already recording"}

    try:
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
        
        logger.info("Initializing Deepgram connection...")
        if not dg_connection.start(options):
            logger.error("Failed to start Deepgram connection")
            raise HTTPException(status_code=500, detail="Failed to start Deepgram connection")
        
        # Start recording
        recording = True
        threading.Thread(target=record_audio, daemon=True).start()
        logger.info("Recording started successfully")
        
        return {"message": "Recording started"}
    except Exception as e:
        logger.error(f"Error starting recording: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to start recording: {str(e)}")

@app.post("/stop")
async def stop_recording():
    """Stop recording and transcription"""
    global recording, dg_connection, current_speaker
    
    if not recording:
        return {"message": "Not recording"}

    # Flush any remaining buffered transcript
    if current_speaker and speaker_buffer[current_speaker]:
        final_transcript = {
            "speaker": current_speaker,
            "transcript": speaker_buffer[current_speaker].strip(),
            "timestamp": datetime.utcnow().isoformat()
        }
        logger.info(f"Broadcasting final buffered transcript: {json.dumps(final_transcript)}")
        await broadcast_transcript(final_transcript)
        speaker_buffer[current_speaker] = ""

    recording = False
    if dg_connection:
        dg_connection.finish()
        dg_connection = None
    
    # Reset speaker tracking
    current_speaker = None
    speaker_buffer.clear()
    last_speaker_time.clear()

    logger.info("Recording stopped")
    return {"message": "Recording stopped"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)