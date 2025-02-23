# HIPPO 🦛 - Air Quality Control for Meetings

HIPPO is an AI-powered meeting analysis tool that helps teams move beyond the "Highest Paid Person's Opinion" effect toward more collaborative and data-driven decision-making.

## Inspiration

Inspired by the HIPPO effect—where the Highest Paid Person's Opinion often dominates discussions—we set out to build a tool that ensures meetings are driven by logic, fairness, and data, rather than hierarchy and bias. Our AI-powered application sits in on meetings, analyzing logical fallacies, sentiment dynamics, and speaker balance to foster more productive and inclusive conversations.

## What it Does

- Real-time meeting transcription with speaker diarization
- Live analysis of:
  - Sentiment dynamics
  - Information density
  - Lexical density
  - Speaker contributions
  - Logical fallacies
- End-of-meeting awards system highlighting key participant behaviors:
  - HIPPO Award (Highest Paid Person's Opinion)
  - ZEBRA Award (Zero Evidence but Really Arrogant)
  - RHINO Award (Really High value, New Opportunity)

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- ElevenLabs API key
- Supabase account

### Environment Setup

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

```bash
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ELEVENLABS_API_KEY=
NEXT_PUBLIC_OPENAI_API_KEY=
```

4. Start the backend server:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

5. Start the frontend server:

```bash
npm install
npm run dev
```


6. Visit `http://localhost:3000` in your browser

## Technical Architecture

- Frontend: Next.js 14+ with TypeScript
- Backend: Python FastAPI
- Real-time Audio Processing:
  - WebSocket connection for ASR
  - Speaker diarization
  - ElevenLabs integration for AI responses
- Analysis Pipeline:
  - SambaNova-powered agents (Llama 3.3 70B)
  - Information density assessment
  - Semantic analysis
  - Entropy measurement
  - Logical fallacy detection
  - Controversy analysis

## Challenges Overcome

- Real-time audio diarization with single microphone input
- WebSocket stream to batch processing conversion
- LLM rate limiting management
- Ultra-low latency pipeline maintenance
- Multi-speaker analysis in real-time

## Future Development

- Speaker type clustering based on interaction patterns
- Automated AI intervention triggers
- Direct integration with:
  - Google Meet
  - Zoom
  - Microsoft Teams
- Additional agent connectors
- Enhanced analysis metrics

## Built With

- ElevenLabs - Voice AI
- FAL - AI Processing
- Lovable - UI Components
- Make - Automation
- Python - Backend
- Supabase - Database
- TypeScript - Frontend

## Acknowledgments

Special thanks to the ElevenLabs team for their support with the voice AI integration.
