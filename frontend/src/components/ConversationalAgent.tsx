'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useState } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';

interface Props {
  onTranscriptUpdate: (transcript: string) => void;
}

export function ConversationalAgent({ onTranscriptUpdate }: Props) {
  const [error, setError] = useState<string | null>(null);
  
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message) => {
      console.log('Message:', message);
      onTranscriptUpdate(message.text);
      
      // Check for fallacies in real-time
      if (message.metadata?.fallacy) {
        // Interrupt the conversation to point out the fallacy
        conversation.sendMessage({
          text: `Hold on! I noticed a ${message.metadata.fallacy.type}. ${message.metadata.fallacy.explanation}`,
          interrupt: true,
        });
      }
    },
    onError: (error) => {
      console.error('Error:', error);
      setError(error.message);
    },
  });

  const getSignedUrl = async (): Promise<string> => {
    const response = await fetch("/api/get-signed-url");
    if (!response.ok) {
      throw new Error(`Failed to get signed url: ${response.statusText}`);
    }
    const { signedUrl } = await response.json();
    return signedUrl;
  };

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const signedUrl = await getSignedUrl();
      await conversation.startSession({ signedUrl });
    } catch (error: any) {
      setError(error.message);
      console.error('Failed to start conversation:', error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={startConversation}
            disabled={conversation.status === 'connected'}
            className={`px-4 py-2 rounded-lg font-medium transition-colors
              ${conversation.status === 'connected'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
          >
            Start Conversation
          </button>
          <button
            onClick={stopConversation}
            disabled={conversation.status !== 'connected'}
            className={`px-4 py-2 rounded-lg font-medium transition-colors
              ${conversation.status !== 'connected'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
          >
            Stop Conversation
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Status:</span>
          <span className={`font-medium ${
            conversation.status === 'connected' ? 'text-green-600' : 'text-gray-600'
          }`}>
            {conversation.status}
          </span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-600">
            {conversation.isSpeaking ? 'Speaking' : 'Listening'}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <ExclamationCircleIcon className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
} 