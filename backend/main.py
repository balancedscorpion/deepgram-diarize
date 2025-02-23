from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import json
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the analyzed conversation once at startup
ANALYZED_CONVERSATION = []
try:
    current_dir = os.path.dirname(os.path.realpath(__file__))
    json_path = os.path.join(current_dir, "analyzed_conversation.json")
    with open(json_path, "r") as f:
        ANALYZED_CONVERSATION = json.load(f)
    logger.info(f"Loaded {len(ANALYZED_CONVERSATION)} analyzed messages")
except Exception as e:
    logger.error(f"Error loading analyzed conversation: {e}")

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@app.get("/conversation")
async def get_conversation():
    """Return the pre-analyzed conversation"""
    if not ANALYZED_CONVERSATION:
        raise HTTPException(status_code=500, detail="No analyzed conversation data available")
    return ANALYZED_CONVERSATION

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server at http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")