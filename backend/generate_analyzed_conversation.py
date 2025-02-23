import json
from sample_conversation import SAMPLE_CONVERSATION
from analysis import analyze_info_density, analyze_sentiment, analyze_controversy, analyze_fallacies
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def analyze_conversation():
    """Analyze the sample conversation and save results to a file"""
    logger.info("Analyzing conversation...")
    analyzed_conversation = []
    
    try:
        for message in SAMPLE_CONVERSATION:
            # Analyze the message
            logger.info(f"Analyzing message: {message['transcript'][:50]}...")
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
            logger.info(f"Analysis complete for message. Found {len(fallacies.get('fallacies', []))} fallacies")
        
        # Save to file
        output_file = "analyzed_conversation.json"
        with open(output_file, "w") as f:
            json.dump(analyzed_conversation, f, indent=2)
        
        logger.info(f"Analysis complete. Results saved to {output_file}")
        return analyzed_conversation
        
    except Exception as e:
        logger.error(f"Error analyzing conversation: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    analyze_conversation() 