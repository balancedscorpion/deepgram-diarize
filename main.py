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
from typing import Optional, Set, List, Dict
from dataclasses import dataclass, asdict
from pathlib import Path

# Import the analysis functions & model
from analysis import TranscriptEntry, get_meeting_objective, get_speaker_sentiment

@dataclass
class TranscriptMemory:
    speaker: str
    transcript: str
    timestamp: str
    analysis: Dict

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

# In-memory transcript storage with persistence
TRANSCRIPT_MEMORY: List[TranscriptMemory] = []
TRANSCRIPT_FILE = "transcript_memory.json"

# Objective caching
OBJECTIVE_CACHE_DURATION = 5  # seconds
last_objective_update = None
cached_objective = None

# Global state
connected_clients: Set[WebSocket] = set()
stop_event = threading.Event()
audio_thread = None
loop = None

# Track partial transcripts so we can broadcast new text without repeating
speaker_partial = {}  # Maps speaker label -> last partial transcript text

def save_transcripts():
    """Save transcripts to file"""
    try:
        with open(TRANSCRIPT_FILE, "w") as f:
            json.dump([asdict(t) for t in TRANSCRIPT_MEMORY], f)
        logger.info(f"Saved {len(TRANSCRIPT_MEMORY)} transcripts to {TRANSCRIPT_FILE}")
    except Exception as e:
        logger.error(f"Error saving transcripts: {e}")

def load_transcripts():
    """Load transcripts from file"""
    global TRANSCRIPT_MEMORY
    try:
        if os.path.exists(TRANSCRIPT_FILE):
            with open(TRANSCRIPT_FILE, "r") as f:
                data = json.load(f)
                TRANSCRIPT_MEMORY = [TranscriptMemory(**t) for t in data]
            logger.info(f"Loaded {len(TRANSCRIPT_MEMORY)} transcripts from {TRANSCRIPT_FILE}")
    except Exception as e:
        logger.error(f"Error loading transcripts: {e}")

# Load transcripts on startup
load_transcripts()

@realtime_router.get("/transcript-memory")
async def get_transcript_memory():
    """Returns the current list of transcript entries from in-memory storage."""
    return [asdict(t) for t in TRANSCRIPT_MEMORY]

@realtime_router.post("/clear-memory")
async def clear_transcript_memory():
    """Clears the transcript memory"""
    global TRANSCRIPT_MEMORY
    TRANSCRIPT_MEMORY = []
    save_transcripts()
    return {"message": "Transcript memory cleared"}

def on_transcript(connection, result, **kwargs):
    alt = result.channel.alternatives[0]
    transcript_text = alt.transcript
    if not transcript_text:
        return

    # Identify speaker if diarization is enabled
    speaker_label = "Unknown"
    if alt.words and alt.words[0].speaker is not None:
        # Add 1 to speaker index to start from 1 instead of 0
        speaker_num = alt.words[0].speaker + 1
        speaker_label = f"Speaker {speaker_num}"

    old_partial = speaker_partial.get(speaker_label, "")
    i = 0
    min_len = min(len(old_partial), len(transcript_text))
    while i < min_len and old_partial[i] == transcript_text[i]:
        i += 1
    new_str = transcript_text[i:].strip()

    if new_str:
        # Create transcript entry
        transcript_data = TranscriptMemory(
            speaker=speaker_label,
            transcript=new_str,
            timestamp=datetime.utcnow().isoformat(),
            analysis={
                "info_density": 0.5,
                "sentiment": 0.0,
                "controversial": False,
                "fallacies": []
            }
        )

        # Store in memory
        TRANSCRIPT_MEMORY.append(transcript_data)
        
        # Save to file periodically (every 10 entries)
        if len(TRANSCRIPT_MEMORY) % 10 == 0:
            save_transcripts()

        # Broadcast to clients
        global loop
        if loop and loop.is_running():
            loop.call_soon_threadsafe(
                lambda: asyncio.create_task(broadcast_transcript(asdict(transcript_data)))
            )

    speaker_partial[speaker_label] = transcript_text 

# -------------------
# Objective Endpoint
# -------------------
@realtime_router.get("/objective")
async def get_objective():
    """
    Return the LLM's textual response for the conversation objective.
    Uses caching to prevent too frequent LLM calls.
    """
    global last_objective_update, cached_objective
    current_time = datetime.utcnow()
    
    # If we have a cached result that's still fresh, return it
    if (last_objective_update and cached_objective and 
        (current_time - last_objective_update).total_seconds() < OBJECTIVE_CACHE_DURATION):
        return {"objective_response": cached_objective}
    
    # If no transcripts, return default message
    if not TRANSCRIPT_MEMORY:
        return {"objective_response": json.dumps([{"Objective": "Real-time transcription with analysis"}])}
    
    # Convert TranscriptMemory to TranscriptEntry for analysis
    transcript_entries = [
        TranscriptEntry(speaker=t.speaker, transcript=t.transcript)
        for t in TRANSCRIPT_MEMORY
    ]
    
    # Get fresh objective
    try:
        llm_response = get_meeting_objective(transcript_entries)
        # Validate JSON format
        json.loads(llm_response)  # This will raise an exception if invalid JSON
        cached_objective = llm_response
        last_objective_update = current_time
        return {"objective_response": llm_response}
    except Exception as e:
        logger.error(f"Error getting objective: {e}")
        # Return last cached objective if available, otherwise default
        if cached_objective:
            return {"objective_response": cached_objective}
        return {"objective_response": json.dumps([{"Objective": "Real-time transcription with analysis"}])}

# -------------------
# Sentiment Endpoint
# -------------------
@realtime_router.get("/sentiment")
async def get_sentiment():
    """
    Return the LLM's textual response for the per-speaker sentiment analysis.
    """
    if not TRANSCRIPT_MEMORY:
        return {"sentiment_response": json.dumps([])}
    
    # Convert TranscriptMemory to TranscriptEntry for analysis
    transcript_entries = [
        TranscriptEntry(speaker=t.speaker, transcript=t.transcript)
        for t in TRANSCRIPT_MEMORY
    ]
    
    try:
        sentiment_response = get_speaker_sentiment(transcript_entries)
        return {"sentiment_response": sentiment_response}
    except Exception as e:
        logger.error(f"Error getting sentiment: {e}")
        return {"sentiment_response": json.dumps([])} 