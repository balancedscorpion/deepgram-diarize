'use client'

import { useState, useRef, useEffect } from 'react'
import { useConversation } from '@11labs/react'
import { PlayIcon, StopIcon } from '@heroicons/react/24/solid'

interface Fallacy {
  type: string;
  segment: string;
  explanation: string;
}

interface Analysis {
  info_density: number;
  sentiment: number;
  controversial: boolean;
  fallacies: Fallacy[];
}

interface Transcript {
  speaker: string;
  name: string;
  transcript: string;
  timestamp: string;
  analysis: Analysis;
  messageId?: string;
}

interface Props {
  transcripts: Transcript[];
}

export default function LiveTranscriptPanel({ transcripts }: Props) {
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [transcriptHeight, setTranscriptHeight] = useState('600px')
  
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message: { text: string; metadata?: any }) => console.log('Message:', message),
    onError: (error: Error) => console.error('Error:', error),
  });

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  const speakerColors = {
    "Speaker 1": "text-blue-600",
    "Speaker 2": "text-emerald-600",
    "Speaker 3": "text-purple-600",
    "Speaker 4": "text-orange-600",
    "Speaker 5": "text-yellow-600",
    "Unknown": "text-gray-600"
  };

  const highlightFallacy = (text: string, fallacies: Fallacy[]) => {
    let highlightedText = text;
    fallacies.forEach(fallacy => {
      highlightedText = highlightedText.replace(
        fallacy.segment,
        `<span class="bg-red-100 group relative cursor-help">
          ${fallacy.segment}
          <span class="hidden group-hover:block absolute bottom-full left-0 w-64 p-2 bg-white border rounded-lg shadow-lg text-sm">
            <strong>${fallacy.type}</strong><br/>
            ${fallacy.explanation}
          </span>
        </span>`
      );
    });
    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  const handlePlay = async (transcript: Transcript) => {
    const messageId = transcript.messageId || transcript.timestamp;
    
    if (playingMessageId === messageId) {
      await conversation.endSession();
      setPlayingMessageId(null);
      return;
    }

    setPlayingMessageId(messageId);
    try {
      await conversation.startSession({
        text: transcript.transcript,
        voiceId: process.env.NEXT_PUBLIC_VOICE_ID
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
      setPlayingMessageId(null);
    }
  };

  return (
    <div className="space-y-4" style={{ maxHeight: transcriptHeight, overflowY: 'auto' }}>
      {transcripts.map((t, index) => {
        const messageId = t.messageId || t.timestamp;
        const isCurrentlyPlaying = playingMessageId === messageId;

        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${speakerColors[t.speaker as keyof typeof speakerColors] || 'text-gray-600'}`}>
                {t.name || t.speaker}
              </span>
              <span className="text-sm text-gray-400">
                {new Date(t.timestamp).toLocaleTimeString()}
              </span>
              <button
                onClick={() => handlePlay(t)}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                disabled={conversation.status === 'connecting'}
              >
                {isCurrentlyPlaying ? (
                  <StopIcon className="w-5 h-5 text-purple-600" />
                ) : (
                  <PlayIcon className="w-5 h-5 text-purple-600" />
                )}
              </button>
            </div>
            <div className="text-gray-600">
              {t.analysis?.fallacies?.length > 0 
                ? highlightFallacy(t.transcript, t.analysis.fallacies)
                : t.transcript
              }
            </div>
            <div className="flex gap-2 text-sm">
              {t.analysis?.info_density > 0.8 && (
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                  High Density
                </span>
              )}
              {t.analysis?.controversial && (
                <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">
                  Controversial
                </span>
              )}
              {t.analysis?.sentiment > 0.5 && (
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                  Positive
                </span>
              )}
              {t.analysis?.sentiment < -0.5 && (
                <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded">
                  Negative
                </span>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
} 