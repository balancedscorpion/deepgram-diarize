# HIPPO 🦛 - Air Quality Control for Meetings

Because sometimes the loudest voice isn't the smartest in the room! 🎯

HIPPO is an AI-powered meeting analysis tool that helps teams move beyond the "Highest Paid Person's Opinion" effect toward more collaborative and data-driven decision-making. Think of it as your meeting's very own air quality monitor, but for hot air! 🌬️

## Inspiration 💡

Inspired by the HIPPO effect—where the Highest Paid Person's Opinion often dominates discussions (we've all been there 🙄)—we set out to build a tool that ensures meetings are driven by logic, fairness, and data, rather than hierarchy and bias. Our AI-powered application sits in on meetings like a friendly ghost 👻, analyzing logical fallacies, sentiment dynamics, and speaker balance to foster more productive and inclusive conversations.

## What it Does 🎯

- Real-time meeting transcription with speaker diarization (because "who said what" matters!)
- Live analysis of:
  - Sentiment dynamics 😊😠
  - Information density 📊
  - Lexical density 📚
  - Speaker contributions 🎤
  - Logical fallacies 🤔
- End-of-meeting awards system (yes, we're keeping receipts! 🧾):
  - HIPPO Award 🦛 (Highest Paid Person's Opinion)
  - ZEBRA Award 🦓 (Zero Evidence but Really Arrogant)
  - RHINO Award 🦏 (Really High value, New Opportunity)

## Getting Started 🚀

### Prerequisites 📋

- Node.js 18+ (the newer the better!)
- Python 3.8+ (🐍)
- ElevenLabs API key (for the fancy AI voice 🎙️)
- Supabase account (where the magic happens ✨)

### Environment Setup 🛠️

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

## Technical Architecture ��️

- Frontend: Next.js 14+ with TypeScript (because we're fancy like that ✨)
- Backend: Python FastAPI (zoom zoom! 🏎️)
- Real-time Audio Processing:
  - WebSocket connection for ASR (ears always open 👂)
  - Speaker diarization (who's who in the zoo 🦁)
  - ElevenLabs integration (for that smooth AI voice 🎙️)
- Analysis Pipeline:
  - SambaNova-powered agents (big brain time 🧠)
  - Information density assessment (separating signal from noise 📡)
  - Semantic analysis (reading between the lines 🔍)
  - Entropy measurement (chaos control 🌪️)
  - Logical fallacy detection (catching those "trust me bro" moments 🕵️)
  - Controversy analysis (drama detector 🎭)

## Challenges Overcome 💪

- Real-time audio diarization with single microphone input
- WebSocket stream to batch processing conversion
- LLM rate limiting management
- Ultra-low latency pipeline maintenance
- Multi-speaker analysis in real-time

## Future Development 🔮

- Speaker type clustering (finding the meeting personas 🎭)
- Automated AI intervention triggers (preventing meeting mayhem 🚨)
- Direct integration with:
  - Google Meet (hey Google! 👋)
  - Zoom (you're on mute! 🤫)
  - Microsoft Teams (because why not? 🤷)
- Additional agent connectors (the more the merrier 🎉)
- Enhanced analysis metrics (numbers go brrr 📈)

## Built With 🛠️

- ElevenLabs - Voice AI 🗣️
- FAL - AI Processing 🧠
- Lovable - UI Components 💝
- Make - Automation 🤖
- Python - Backend 🐍
- Supabase - Database 🗄️
- TypeScript - Frontend ⌨️

## Acknowledgments 🙏

Special thanks to the ElevenLabs team for their support with the voice AI integration. You're the real MVPs! 🏆

Remember: No HIPPOs were harmed in the making of this application! 🦛✌️
