import os
from openai import OpenAI

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_info_density(text: str) -> float:
    prompt = f"""Analyze the following spoken text and rate its information density on a scale from 0 to 1.
Information density measures how much meaningful, unique, and concise information is conveyed.
Return only a float value between 0 and 1.

Text: "{text}"
"""
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
        )
        density = float(response.choices[0].message.content.strip())
        return density
    except Exception as e:
        print(f"Error analyzing info density: {e}")
        return 0.0

def analyze_sentiment(text: str) -> float:
    prompt = f"""Analyze the sentiment of the following spoken text.
Return a float value between -1 (very negative) and 1 (very positive).

Text: "{text}"
"""
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
        )
        sentiment = float(response.choices[0].message.content.strip())
        return sentiment
    except Exception as e:
        print(f"Error analyzing sentiment: {e}")
        return 0.0

def analyze_controversy(text: str) -> bool:
    prompt = f"""Analyze the following statement.
Does it express a controversial opinion or disagreement? Respond with "yes" or "no".

Text: "{text}"
"""
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
        )
        result = response.choices[0].message.content.strip().lower()
        return result.startswith("yes")
    except Exception as e:
        print(f"Error analyzing controversy: {e}")
        return False

def analyze_fact_check(text: str, previous_transcripts: str) -> dict:
    prompt = f"""Analyze the following statement from a meeting and verify if it aligns with past meetings.
Here's what was said:  
"{text}"  

Here are relevant past conversations:  
{previous_transcripts}  

1. Is this statement factually accurate? ("true" or "false")  
2. If false, provide a correction.  
Return JSON: {{"fact_check": true/false, "correction": "Correct statement"}}.
"""
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
        )
        import json
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        print(f"Error fact checking: {e}")
        return {"fact_check": True, "correction": ""} 
    

def analyze_fallacies(text: str) -> dict:
    prompt = """Analyze the following text for logical fallacies:

Text: "{text}"

Return a JSON object identifying any fallacies found, following this format:
{{
    "fallacies": [
        {{
            "type": "fallacy_name",
            "segment": "exact text segment containing fallacy",
            "explanation": "brief explanation of why this is a fallacy"
        }}
    ]
}}

If no fallacies are found, return an empty array.
"""
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt.format(text=text)}],
            temperature=0.0,
        )
        import json
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        print(f"Error analyzing fallacies: {e}")
        return {"fallacies": []} 
    

import os
from typing import List
from pydantic import BaseModel
import openai

class TranscriptEntry(BaseModel):
    """
    Represents a single snippet of transcript, including the speaker label/name
    and the spoken text.
    """
    speaker: str
    transcript: str

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