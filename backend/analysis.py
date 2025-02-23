import os
import openai

# Set your OpenAI API key via an env variable "OPENAI_API_KEY"
openai.api_key = os.getenv("OPENAI_API_KEY")

def analyze_info_density(text: str) -> float:
    prompt = f"""Analyze the following spoken text and rate its information density on a scale from 0 to 1.
Information density measures how much meaningful, unique, and concise information is conveyed.
Return only a float value between 0 and 1.

Text: "{text}"
"""
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
    )
    try:
        density = float(response.choices[0].message.content.strip())
        return density
    except Exception:
        return 0.0

def analyze_sentiment(text: str) -> float:
    prompt = f"""Analyze the sentiment of the following spoken text.
Return a float value between -1 (very negative) and 1 (very positive).

Text: "{text}"
"""
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
    )
    try:
        sentiment = float(response.choices[0].message.content.strip())
        return sentiment
    except Exception:
        return 0.0

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
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
    )
    import json
    try:
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception:
        return {"fact_check": True, "correction": ""}

def analyze_controversy(text: str) -> bool:
    prompt = f"""Analyze the following statement.
Does it express a controversial opinion or disagreement? Respond with "yes" or "no".

Text: "{text}"
"""
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
    )
    result = response.choices[0].message.content.strip().lower()
    return result.startswith("yes") 