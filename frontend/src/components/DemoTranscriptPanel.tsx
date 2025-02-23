'use client'

import { useState } from 'react'
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

export default function DemoTranscriptPanel({ transcripts }: Props) {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const highlightFallacy = (text: string, fallacies: Fallacy[]) => {
    let highlightedText = text;
    fallacies.forEach(fallacy => {
      highlightedText = highlightedText.replace(
        fallacy.segment,
        `<span class="bg-red-100 relative group cursor-help">
          ${fallacy.segment}
          <span class="invisible group-hover:visible absolute bottom-full left-0 w-64 p-2 bg-white border rounded-lg shadow-lg text-sm z-10">
            <strong class="text-red-600">${fallacy.type}</strong><br/>
            ${fallacy.explanation}
          </span>
        </span>`
      );
    });
    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  const handlePlay = async (transcript: Transcript) => {
    const messageId = transcript.messageId || transcript.timestamp;
    
    if (playingId === messageId) {
      audioElement?.pause();
      setPlayingId(null);
      setAudioElement(null);
      return;
    }

    try {
      setPlayingId(messageId);
      
      // First get available voices
      const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!
        }
      });

      if (!voicesResponse.ok) {
        throw new Error('Failed to get voices');
      }

      const voices = await voicesResponse.json();
      const voice = voices.voices[0]; // Use first available voice

      // Then generate speech
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.voice_id}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text: transcript.transcript,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setPlayingId(null);
        setAudioElement(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      setAudioElement(audio);
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      setPlayingId(null);
      setAudioElement(null);
    }
  };

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {transcripts.map((t, i) => {
        const messageId = t.messageId || t.timestamp;
        const isCurrentlyPlaying = playingId === messageId;

        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`font-medium text-${t.speaker === 'Speaker 1' ? 'blue' : t.speaker === 'Speaker 2' ? 'emerald' : t.speaker === 'Speaker 3' ? 'purple' : t.speaker === 'Speaker 4' ? 'orange' : 'yellow'}-600`}>
                {t.name || t.speaker}
              </span>
              <span className="text-sm text-gray-400">
                {new Date(t.timestamp).toLocaleTimeString()}
              </span>
              <button
                onClick={() => handlePlay(t)}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                {isCurrentlyPlaying ? (
                  <StopIcon className="w-4 h-4 text-purple-600" />
                ) : (
                  <PlayIcon className="w-4 h-4 text-purple-600" />
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
            </div>
          </div>
        );
      })}
    </div>
  );
} 