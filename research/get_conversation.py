import requests
import os

SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")
if not SUPABASE_API_KEY:
    raise EnvironmentError("Missing environment variable 'SUPABASE_API_KEY'.")

PROJECT_ID = "mqaiuwpvphctupwtvidm"
# Construct the Supabase REST URL using the PROJECT_ID
SUPABASE_URL = f"https://{PROJECT_ID}.supabase.co/rest/v1/conversations"

def get_all_conversations():
    """
    Retrieves all rows from the 'conversations' table via GET.
    """
    url = f"{SUPABASE_URL}?select=*"
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Failed to retrieve conversations from Supabase: {e}")
        return []
    
print(get_all_conversations())