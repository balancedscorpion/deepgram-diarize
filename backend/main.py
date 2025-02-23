from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from sample_conversation import SAMPLE_CONVERSATION
from analysis import analyze_info_density, analyze_sentiment, analyze_controversy, analyze_fallacies

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

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@app.get("/conversation")
async def get_conversation():
    """Return the sample conversation with analysis"""
    try:
        logger.info("Analyzing conversation...")
        analyzed_conversation = []
        
        for message in SAMPLE_CONVERSATION:
            # Analyze the message
            info_density = analyze_info_density(message["transcript"])
            sentiment = analyze_sentiment(message["transcript"])
            is_controversial = analyze_controversy(message["transcript"])
            fallacies = analyze_fallacies(message["transcript"])
            
            # Add analysis to the message
            analyzed_message = {
                **message,
                "analysis": {
                    "info_density": info_density,
                    "sentiment": sentiment,
                    "controversial": is_controversial,
                    "fallacies": fallacies.get("fallacies", [])
                }
            }
            analyzed_conversation.append(analyzed_message)
        
        logger.info(f"Analysis complete. Processed {len(analyzed_conversation)} messages")
        return analyzed_conversation
    except Exception as e:
        logger.error(f"Error processing conversation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server at http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")