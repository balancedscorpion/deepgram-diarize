'use client'

import { useState } from 'react'
import { useConversation } from '@11labs/react'
import { MicrophoneIcon, StopIcon, PlayIcon } from '@heroicons/react/24/solid'

interface Props {
  onTranscriptUpdate: (transcript: string) => void;
}

interface MessageMetadata {
  fallacy?: {
    type: string;
    explanation: string;
  };
}

interface Message {
  text: string;
  metadata?: MessageMetadata;
}

interface ConversationMessage {
  text: string;
  interrupt?: boolean;
}

interface ConversationHook {
  startSession: (options: { signedUrl: string }) => Promise<void>;
  endSession: () => Promise<void>;
  status: 'idle' | 'connecting' | 'connected' | 'disconnected';
  isSpeaking: boolean;
  sendMessage: (message: ConversationMessage) => Promise<void>;
}

export default function LiveConversationPanel({ onTranscriptUpdate }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<{ 
    text: string; 
    isUser: boolean;
    timestamp: string;
  }[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to conversation');
      setTranscripts(prev => [...prev, { 
        text: "Hello! I'm ready to chat.", 
        isUser: false,
        timestamp: new Date().toISOString()
      }]);
    },
    onDisconnect: () => {
      console.log('Disconnected from conversation');
    },
    onMessage: (message: any) => {
      console.log('Message:', message);
      
      const timestamp = new Date().toISOString();
      
      if (message.source === 'user') {
        setTranscripts(prev => [...prev, { 
          text: message.message, 
          isUser: true,
          timestamp 
        }]);
      }
      else if (message.source === 'ai') {
        setTranscripts(prev => [...prev, { 
          text: message.message, 
          isUser: false,
          timestamp
        }]);
      }

      onTranscriptUpdate(message.message);
      
      if (message.metadata?.fallacy) {
        conversation.sendMessage({
          text: `I noticed a ${message.metadata.fallacy.type} in what you just said. ${message.metadata.fallacy.explanation}`,
          interrupt: true
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error:', error);
      setError(error.message);
    }
  }) as ConversationHook;

  const handlePlay = async (text: string, timestamp: string) => {
    if (playingId === timestamp) {
      setPlayingId(null);
      return;
    }

    try {
      setPlayingId(timestamp);
      
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + process.env.NEXT_PUBLIC_VOICE_ID, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setPlayingId(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      setPlayingId(null);
    }
  };

  const startConversation = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support microphone access. Please try using Chrome or Firefox.');
      }

      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const response = await fetch("/api/get-signed-url");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get conversation URL');
      }
      
      const data = await response.json();
      await conversation.startSession({ signedUrl: data.signedUrl });
    } catch (error: any) {
      setError(error.message);
      console.error('Failed to start conversation:', error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={startConversation}
            disabled={conversation.status === 'connected'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${conversation.status === 'connected'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
          >
            <MicrophoneIcon className="w-5 h-5" />
            {conversation.status === 'connected' ? 'Listening...' : 'Start Conversation'}
          </button>
          {conversation.status === 'connected' && (
            <button
              onClick={() => conversation.endSession()}
              className="px-4 py-2 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100"
            >
              Stop
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Status:</span>
          <span className={`font-medium ${
            conversation.status === 'connected' ? 'text-green-600' : 'text-gray-600'
          }`}>
            {conversation.status}
          </span>
          {conversation.status === 'connected' && (
            <>
              <span className="text-gray-500">•</span>
              <span className="text-gray-600">
                {conversation.isSpeaking ? 'Speaking' : 'Listening'}
              </span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 h-[400px] overflow-y-auto">
        {transcripts.map((transcript, i) => (
          <div 
            key={i} 
            className={`mb-2 p-2 rounded flex items-start gap-2 ${
              transcript.isUser 
                ? 'bg-blue-50 text-blue-700 ml-auto max-w-[80%]' 
                : 'bg-white text-gray-700 mr-auto max-w-[80%]'
            }`}
          >
            <div className="flex-grow">
              <div className="text-sm text-gray-500 mb-1">
                {transcript.isUser ? 'You' : 'AI Assistant'}
              </div>
              {transcript.text}
            </div>
            {!transcript.isUser && (
              <button
                onClick={() => handlePlay(transcript.text, transcript.timestamp)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <PlayIcon className={`w-4 h-4 ${
                  playingId === transcript.timestamp ? 'text-purple-600' : 'text-gray-400'
                }`} />
              </button>
            )}
          </div>
        ))}
        {conversation.status === 'connected' && (
          <div className="text-gray-500 italic text-center mt-2">
            {conversation.isSpeaking ? 'AI is speaking...' : 'Listening to you...'}
          </div>
        )}
      </div>
    </div>
  );
} 