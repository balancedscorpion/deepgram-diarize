import os
import pyaudio
import threading
import sys
import json
import requests
from datetime import datetime

from deepgram import (
    DeepgramClient,
    LiveTranscriptionEvents,
    LiveOptions
)

#######################
# Retrieve config from environment variables
#######################
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
if not DEEPGRAM_API_KEY:
    raise EnvironmentError("Missing environment variable 'DEEPGRAM_API_KEY'.")

SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")
if not SUPABASE_API_KEY:
    raise EnvironmentError("Missing environment variable 'SUPABASE_API_KEY'.")

PROJECT_ID = "mqaiuwpvphctupwtvidm"
# Construct the Supabase REST URL using the PROJECT_ID
SUPABASE_URL = f"https://{PROJECT_ID}.supabase.co/rest/v1/conversations"

#######################
# Microphone Parameters
#######################
CHUNK = 1024           # Number of frames per buffer
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000           # Sample rate
INPUT_DEVICE_INDEX = None  # If you have multiple mics, set the device index

# We'll accumulate transcripts for batch saving
transcripts = []

def on_transcript(connection, result, **kwargs):
    """
    Callback for when a new transcript is received in real time.
    """
    alt = result.channel.alternatives[0]
    transcript = alt.transcript
    if not transcript:
        return  # If there's no transcript text, skip

    # Diarization support: check if words exist and have a 'speaker' value
    words = alt.words
    if words and words[0].speaker is not None:
        speaker_id = words[0].speaker
        print(f"Speaker {speaker_id}: {transcript}")
        speaker_str = f"Speaker {speaker_id}"
    else:
        # Fallback if no diarization info
        print(f"Transcript: {transcript}")
        speaker_str = "Unknown"

    # 1) Accumulate transcripts for batch saving
    transcripts.append({
        "speaker": speaker_str,
        "transcript": transcript,
        "timestamp": datetime.utcnow().isoformat()
    })

    # 2) Send to Supabase in real time
    try:
        # Supabase expects an array of objects for insertion
        payload = [{
            "speaker": speaker_str,
            "transcript": transcript,
            "timestamp": datetime.utcnow().isoformat()
        }]
        headers = {
            "Content-Type": "application/json",
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Prefer": "return=minimal"
        }
        response = requests.post(SUPABASE_URL, json=payload, headers=headers, timeout=5)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Failed to send transcript to Supabase: {e}")

def main():
    # 1) Initialize Deepgram client
    deepgram = DeepgramClient(DEEPGRAM_API_KEY)

    # 2) Create a WebSocket connection object for real-time transcription
    dg_connection = deepgram.listen.websocket.v("1")

    # 3) Attach a callback for transcription events
    dg_connection.on(LiveTranscriptionEvents.Transcript, on_transcript)

    # 4) Create options for the Deepgram streaming connection
    #    Including diarization
    options = LiveOptions(
        model="enhanced-meeting",
        diarize=True,        # Enable speaker diarization
        encoding="linear16", # PCM linear 16 from the microphone
        sample_rate=RATE,
        channels=CHANNELS,
        punctuate=True,      # optional punctuation
    )

    # 5) Start the WebSocket connection (synchronously). Returns bool.
    started = dg_connection.start(options)
    if not started:
        print("Failed to start Deepgram WebSocket connection.")
        sys.exit(1)

    # 6) Set up PyAudio to read from your microphone
    p = pyaudio.PyAudio()
    stream = p.open(
        format=FORMAT,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        frames_per_buffer=CHUNK,
        input_device_index=INPUT_DEVICE_INDEX
    )

    # Use a threading.Event to stop the mic thread
    stop_event = threading.Event()

    def read_mic():
        """
        Continuously read data from the mic and send to Deepgram.
        """
        while not stop_event.is_set():
            data = stream.read(CHUNK, exception_on_overflow=False)
            dg_connection.send(data)

    # 7) Start the microphone-reading thread
    mic_thread = threading.Thread(target=read_mic)
    mic_thread.start()

    print("Listening... (press Enter or Ctrl+C to stop)\n")

    # 8) Wait for user input to terminate
    try:
        input("")
    except KeyboardInterrupt:
        pass

    # 9) Signal our mic thread to stop
    stop_event.set()
    mic_thread.join()

    # 10) Notify Deepgram no more audio will be sent
    dg_connection.finish()

    # 11) Close the audio stream
    stream.stop_stream()
    stream.close()
    p.terminate()

    # 12) Write transcripts to a JSON file for batch usage
    with open("transcripts.json", "w", encoding="utf-8") as f:
        json.dump(transcripts, f, indent=2, ensure_ascii=False)

    print("\nFinished. Check transcripts.json for batch output.\n")

if __name__ == "__main__":
    main()
