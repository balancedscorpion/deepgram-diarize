import os
import pyaudio
import threading
import sys

from deepgram import (
    DeepgramClient,
    LiveTranscriptionEvents,
    LiveOptions
)

#######################
# Retrieve API key from environment variable
#######################
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
if not DEEPGRAM_API_KEY:
    raise EnvironmentError("Missing environment variable 'DEEPGRAM_API_KEY'.")

#######################
# Microphone Parameters
#######################
CHUNK = 1024           # Number of frames per buffer
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000           # Sample rate
INPUT_DEVICE_INDEX = None  # If you have multiple mics, you can set the device index

def on_transcript(connection, result, **kwargs):
    """
    Callback for when a new transcript is received from Deepgram in real time.
    This function expects typed objects, not dictionaries.
    """
    # Get the first alternative (this is a ListenWSAlternative, not a dict)
    alt = result.channel.alternatives[0]
    
    # The actual transcript text:
    transcript = alt.transcript
    if not transcript:
        return  # If there's no transcript text, skip printing

    # 'alt.words' is likely a list of typed word objects (ListenWSWord)
    words = alt.words  # May be None or an empty list if no words
    if words and words[0].speaker is not None:
        # If diarization is enabled, the 'speaker' field indicates the speaker index
        speaker_id = words[0].speaker
        print(f"Speaker {speaker_id}: {transcript}")
    else:
        # No speaker label found; just print the transcript
        print(f"Transcript: {transcript}")

def main():
    # Initialize Deepgram client with your API key
    deepgram = DeepgramClient(DEEPGRAM_API_KEY)

    # Create a WebSocket connection object for real-time transcription
    dg_connection = deepgram.listen.websocket.v("1")

    # Attach a callback for transcription events
    dg_connection.on(LiveTranscriptionEvents.Transcript, on_transcript)

    # Create options for the Deepgram streaming connection
    # Note `diarize=True` to enable speaker diarization
    options = LiveOptions(
        model="nova-3",      # You can also use 'nova-2', 'general', etc.
        diarize=True,        # Enable speaker diarization
        encoding="linear16", # PCM linear 16 audio from the microphone
        sample_rate=RATE,    
        channels=CHANNELS,   
        punctuate=True,      # (optional) get punctuation
    )

    # Start the WebSocket connection (synchronously).
    started = dg_connection.start(options)
    if not started:
        print("Failed to start Deepgram WebSocket connection.")
        sys.exit(1)

    # Set up PyAudio to read from your microphone
    p = pyaudio.PyAudio()
    stream = p.open(
        format=FORMAT,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        frames_per_buffer=CHUNK,
        input_device_index=INPUT_DEVICE_INDEX
    )

    # Use a threading.Event to cleanly stop the mic thread
    stop_event = threading.Event()

    def read_mic():
        """
        Continuously read data from the microphone in CHUNK-sized buffers
        and send it to Deepgram for transcription.
        """
        while not stop_event.is_set():
            data = stream.read(CHUNK, exception_on_overflow=False)
            dg_connection.send(data)

    # Start the thread that reads from the mic
    mic_thread = threading.Thread(target=read_mic)
    mic_thread.start()

    print("Listening... (press Enter to stop)\n")

    # Wait for user input to terminate
    try:
        input("")
    except KeyboardInterrupt:
        # The user pressed Ctrl+C
        pass

    # Signal our thread to stop
    stop_event.set()
    mic_thread.join()

    # Tell Deepgram we’re finished sending audio
    dg_connection.finish()

    # Clean up the audio stream
    stream.stop_stream()
    stream.close()
    p.terminate()

    print("Finished.")

if __name__ == "__main__":
    main()
