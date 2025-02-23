import os
import json
import threading
from datetime import datetime

import pyaudio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketState

# Deepgram imports
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions

####################################
# Environment / Configuration
####################################
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "YOUR_DEEPGRAM_API_KEY")

# PyAudio settings
CHUNK = 1024
RATE = 16000
CHANNELS = 1
FORMAT = pyaudio.paInt16

####################################
# FastAPI Setup
####################################
app = FastAPI()

# Enable CORS for local dev (adjust as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track WebSocket connections
connected_clients = set()

# Thread / event for capturing audio
stop_event = threading.Event()
audio_thread = None

####################################
# Broadcast Helper
####################################
def broadcast_transcript(data: dict):
    """
    Sends transcript JSON to all /ws clients.
    Since on_transcript is called from a non-async context,
    we schedule the actual send on the main thread's event loop
    using starlette's 'threading' approach or a standard approach.
    However, if this causes an event-loop error, you can simply
    iterate over connected_clients and call ws.send_text in a try/except.
    """
    payload = json.dumps(data)
    for ws in list(connected_clients):
        if ws.client_state == WebSocketState.CONNECTED:
            try:
                ws.send_text(payload)
            except Exception:
                pass  # e.g. if client closed unexpectedly

####################################
# Deepgram Transcription Callback
####################################
def on_transcript(connection, result, **kwargs):
    alt = result.channel.alternatives[0]
    text = alt.transcript

    # Skip if no text (empty partial)
    if not text:
        return

    # Log to console
    print("Transcript:", text)

    # Build transcript dict
    transcript_data = {
        "transcript": text,
        "timestamp": datetime.utcnow().isoformat()
    }

    # Broadcast to all connected websockets
    broadcast_transcript(transcript_data)

####################################
# Audio Worker Thread
####################################
def audio_worker():
    """
    1. Create a Deepgram client.
    2. Start the WebSocket connection (synchronously).
    3. Open mic, read data, send to Deepgram.
    4. When stop_event is set, finish and clean up.
    """
    print("Audio worker starting...")

    # 1) Initialize the Deepgram client
    dg = DeepgramClient(DEEPGRAM_API_KEY)

    # 2) Create the WebSocket connection object
    dg_connection = dg.listen.websocket.v("1")

    # Register the callback for transcripts
    dg_connection.on(LiveTranscriptionEvents.Transcript, on_transcript)

    # Create transcription options
    options = LiveOptions(
        model="general-enhanced",  # or "enhanced-meeting"
        encoding="linear16",
        sample_rate=RATE,
        channels=CHANNELS,
        punctuate=True,
        interim_results=True,  # get partial transcripts
    )

    # Start connection (returns bool, not a coroutine)
    started = dg_connection.start(options)
    if not started:
        print("Failed to start Deepgram WebSocket connection.")
        return

    # 3) Open PyAudio
    p = pyaudio.PyAudio()
    stream = p.open(
        format=FORMAT,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        frames_per_buffer=CHUNK
    )

    print("Recording audio. Speak into your microphone...")

    try:
        # Continuously read mic data until stop_event is set
        while not stop_event.is_set():
            data = stream.read(CHUNK, exception_on_overflow=False)
            dg_connection.send(data)  # send is synchronous
    except Exception as e:
        print("Audio worker error:", e)
    finally:
        # 4) Finish
        print("Finishing Deepgram connection...")
        dg_connection.finish()

        stream.stop_stream()
        stream.close()
        p.terminate()
        print("Audio worker stopped.")

####################################
# Start/Stop Endpoints
####################################
@app.post("/start")
async def start_recording():
    global audio_thread
    if audio_thread and audio_thread.is_alive():
        return {"message": "Already recording."}

    stop_event.clear()
    audio_thread = threading.Thread(target=audio_worker, daemon=True)
    audio_thread.start()
    return {"message": "Recording started"}

@app.post("/stop")
async def stop_recording():
    global audio_thread
    if not audio_thread or not audio_thread.is_alive():
        return {"message": "Not currently recording."}

    stop_event.set()
    audio_thread.join()
    audio_thread = None
    return {"message": "Recording stopped"}

####################################
# WebSocket: /ws
####################################
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    print("Client connected. Total:", len(connected_clients))

    try:
        while True:
            # Keep connection open. If you need data from client, handle it here
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        connected_clients.remove(websocket)
        print("Client disconnected. Total:", len(connected_clients))

####################################
# Entry Point
####################################
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
