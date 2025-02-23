# Meeting Intelligence

Real-time transcription and analysis of meetings with speaker diarization, sentiment analysis, and objective tracking.

## Setup

### Backend Setup

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
export DEEPGRAM_API_KEY="your_deepgram_api_key"
export SAMBANOVA_API_KEY="your_sambanova_api_key"
```

3. Start the uvicorn server:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

The backend server must be running on port 8000 for the frontend to work properly.

### Frontend Setup

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Usage

1. Make sure both servers are running:
   - Backend: uvicorn server on port 8000
   - Frontend: Next.js server on port 3000

2. Open your browser to http://localhost:3000

3. You can switch between Demo mode and Real-time mode using the button in the top right.

## Features

- Real-time transcription with speaker diarization
- Sentiment analysis per speaker
- Meeting objective tracking
- Information density analysis
- Fallacy detection
- Interactive visualizations

## Architecture

- Backend: FastAPI + Uvicorn
- Frontend: Next.js 13+ with App Router
- Real-time: WebSocket connections
- ML: Deepgram for transcription, SambaNova for analysis 