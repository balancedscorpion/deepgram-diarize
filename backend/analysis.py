# analysis.py

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

For each unique speaker, compute a sentiment score that reflects the overall tone of their contributions. The sentiment score should be a floating point number between -1 (very negative) and 1 (very positive).

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
