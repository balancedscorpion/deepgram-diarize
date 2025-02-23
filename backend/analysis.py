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