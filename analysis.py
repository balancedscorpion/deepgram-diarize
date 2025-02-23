# analysis.py

import os
from typing import List
from pydantic import BaseModel
import openai
import json
from datetime import datetime

class TranscriptEntry(BaseModel):
    """
    Represents a single snippet of transcript, including the speaker label/name
    and the spoken text.
    """
    speaker: str
    transcript: str

def analyze_transcript(text: str) -> dict:
    """
    Analyze a transcript snippet for:
    - Information density (0-1)
    - Sentiment (-1 to 1)
    - Controversial flag (boolean)
    - Logical fallacies (list)
    """
    # For now, return default values
    # In a production environment, this would use more sophisticated analysis
    return {
        "info_density": 0.5,
        "sentiment": 0.0,
        "controversial": False,
        "fallacies": []
    }

def get_meeting_objective(transcript_entries: List[TranscriptEntry]) -> str:
    """
    Given a list of transcript entries, this function:
      1) Aggregates them into a single string (conversation_history).
      2) Defines a system prompt instructing the LLM to produce a JSON array
         with the conversation's objective.
      3) Calls your SambaNova (or other) LLM using openai.py.
      4) Returns the LLM's textual response (expected to be valid JSON).
    """
    # Build a single text of all speaker transcripts
    conversation_history = "\n".join(
        f"{entry.speaker}: {entry.transcript}"
        for entry in transcript_entries
    )

    system_prompt = """You are reviewing a conversation among multiple participants.

    Your goal is to produce a JSON array containing the objective of the conversation.

    The output:
    - MUST be valid JSON conforming to the schema below:
      [
        {
          "Objective": "some string"
        }
      ]
    - MUST NOT include additional commentary or formatting."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": conversation_history}
    ]

    client = openai.OpenAI(
        api_key=os.environ.get("SAMBANOVA_API_KEY"),
        base_url="https://api.sambanova.ai/v1",
    )

    response = client.chat.completions.create(
        model="Meta-Llama-3.3-70B-Instruct",
        messages=messages,
        response_format={"type": "json_object"},  # optional, depends on your config
        temperature=0.1,
        top_p=0.1
    )

    llm_content = response.choices[0].message.content
    return llm_content

def get_speaker_sentiment(transcript_entries: List[TranscriptEntry]) -> str:
    """
    Given a list of transcript entries, this function:
      1) Aggregates them into a single string (conversation_history).
      2) Defines a system prompt instructing the LLM to produce a JSON array
         with a sentiment score per speaker.
      3) Calls your SambaNova (or other) LLM using openai.py.
      4) Returns the LLM's textual response (expected to be valid JSON).

    The LLM's response is expected to be valid JSON of the form:
      [
        {
          "Speaker": "speaker name",
          "Sentiment": sentiment score (float)
        }
      ]
    """
    conversation_history = "\n".join(
        f"{entry.speaker}: {entry.transcript}"
        for entry in transcript_entries
    )

    system_prompt = """You are reviewing a conversation among multiple participants.

Your goal is to produce a JSON array containing the sentiment score per speaker provided in the conversation.

For each unique speaker, compute a sentiment score that reflects the overall tone of that individual speaker. Make sure to compute the sentiment score ONLY for that speaker. The sentiment score should be a floating point number between -1 (very negative) and 1 (very positive).

The output:
- MUST be valid JSON conforming to the schema below:
  [
    {
      "Speaker": "speaker name",
      "Sentiment": sentiment score (number)
    }
  ]
- MUST NOT include additional commentary or formatting."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": conversation_history}
    ]

    client = openai.OpenAI(
        api_key=os.environ.get("SAMBANOVA_API_KEY"),
        base_url="https://api.sambanova.ai/v1",
    )

    response = client.chat.completions.create(
        model="Meta-Llama-3.3-70B-Instruct",
        messages=messages,
        response_format={"type": "json_object"},  # optional, depends on your config
        temperature=0.1,
        top_p=0.1
    )

    llm_content = response.choices[0].message.content
    return llm_content

def update_transcript_analysis(transcript_entries: List[TranscriptEntry]) -> List[dict]:
    """
    Update the analysis for all transcript entries.
    Returns a list of transcript entries with updated analysis.
    """
    updated_entries = []
    for entry in transcript_entries:
        # Get real-time analysis
        analysis = analyze_transcript(entry.transcript)
        
        # Get sentiment if available
        try:
            sentiment_data = json.loads(get_speaker_sentiment([entry]))
            if isinstance(sentiment_data, list):
                for speaker_sentiment in sentiment_data:
                    if speaker_sentiment["Speaker"] == entry.speaker:
                        analysis["sentiment"] = speaker_sentiment["Sentiment"]
                        break
        except Exception:
            pass  # Keep default sentiment if analysis fails
        
        updated_entries.append({
            "speaker": entry.speaker,
            "transcript": entry.transcript,
            "timestamp": datetime.utcnow().isoformat(),
            "analysis": analysis
        })
    
    return updated_entries 