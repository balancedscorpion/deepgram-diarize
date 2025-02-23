import os
import requests

SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")
PROJECT_ID = os.getenv("SUPABASE_PROJECT_ID")  # e.g., "mqaiuwpvphctupwtvidm"
SUPABASE_URL = f"https://{PROJECT_ID}.supabase.co/rest/v1"

def insert_transcript(data: dict):
    """
    Insert a transcript (or analysis) row into the "transcripts" table.
    `data` must be a dictionary, for example:
      {
        "speaker": "Speaker 1",
        "transcript": "Hello world",
        "timestamp": "2025-01-01T00:00:00Z"
      }
    """
    url = f"{SUPABASE_URL}/transcripts"
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    response = requests.post(url, json=[data], headers=headers, timeout=5)
    response.raise_for_status()
    return response.json()

def get_transcripts():
    """
    Get all transcripts from Supabase.
    """
    url = f"{SUPABASE_URL}/transcripts?select=*"
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}"
    }
    response = requests.get(url, headers=headers, timeout=5)
    response.raise_for_status()
    return response.json()

def get_previous_transcripts():
    """
    Get the 10 most recent transcripts (for optional context).
    Returns joined text from the "transcript" field.
    """
    url = f"{SUPABASE_URL}/transcripts?select=transcript&order=timestamp.desc&limit=10"
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}"
    }
    response = requests.get(url, headers=headers, timeout=5)
    response.raise_for_status()
    transcripts = response.json()
    return "\n".join([
        item["transcript"] for item in transcripts if "transcript" in item
    ])
