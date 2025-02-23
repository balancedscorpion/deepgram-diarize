'use client'

import { useState, useEffect, useRef } from 'react'
import { PlayIcon, StopIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'

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
  isAIIntervention?: boolean;
}

interface Props {
  transcripts: Transcript[];
  onVisibleIndexChange?: (index: number) => void;
  onComplete?: (complete: boolean) => void;
}

interface StreamingState {
  isStreaming: boolean;
  showTags: boolean;
}

export default function DemoTranscriptPanel({ 
  transcripts: fullTranscripts,
  onVisibleIndexChange,
  onComplete
}: Props) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [visibleTranscripts, setVisibleTranscripts] = useState<Transcript[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingStates, setStreamingStates] = useState<{ [key: string]: StreamingState }>({});
  const streamingRef = useRef<boolean>(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [transcriptHeight, setTranscriptHeight] = useState('300px');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "end"
    });
  };

  useEffect(() => {
    if (isStreaming) {
      scrollToBottom();
    }
  }, [visibleTranscripts, isStreaming]);

  useEffect(() => {
    if (!hasStarted || currentIndex >= fullTranscripts.length) {
      setIsComplete(true);
      return;
    }
    
    if (isPaused) return;

    const transcript = fullTranscripts[currentIndex];
    const delay = transcript.isAIIntervention ? 500 : 1000;

    const timer = setTimeout(() => {
      if (isPaused) return;
      
      setVisibleTranscripts(prev => [...prev, {
        ...transcript,
        transcript: ''
      }]);
      streamText(transcript.transcript, transcript.isAIIntervention, transcript.timestamp);
    }, delay);

    return () => clearTimeout(timer);
  }, [currentIndex, fullTranscripts, onVisibleIndexChange, isPaused, hasStarted]);

  const streamText = async (text: string, isAI: boolean = false, timestamp: string) => {
    streamingRef.current = true;
    setStreamingStates(prev => ({
      ...prev,
      [timestamp]: { isStreaming: true, showTags: false }
    }));
    
    const streamDelay = isAI ? 20 : 25;
    
    for (let i = 0; i <= text.length; i++) {
      if (!streamingRef.current || isPaused) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, streamDelay));
      setVisibleTranscripts(prev => {
        const newTranscripts = [...prev];
        if (newTranscripts.length > 0) {
          newTranscripts[newTranscripts.length - 1] = {
            ...newTranscripts[newTranscripts.length - 1],
            transcript: text.slice(0, i)
          };
        }
        return newTranscripts;
      });
    }
    
    if (!isPaused) {
      setStreamingStates(prev => ({
        ...prev,
        [timestamp]: { isStreaming: false, showTags: true }
      }));
      streamingRef.current = false;
      setCurrentIndex(prev => prev + 1);
      onVisibleIndexChange?.(currentIndex + 1);
    }
  };

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

  const togglePause = () => {
    setIsPaused(prev => {
      if (!prev) {
        streamingRef.current = false;
      } else {
        streamingRef.current = true;
        const currentTranscript = fullTranscripts[currentIndex];
        if (currentTranscript) {
          streamText(
            currentTranscript.transcript,
            currentTranscript.isAIIntervention,
            currentTranscript.timestamp
          );
        }
      }
      return !prev;
    });
  };

  const startDemo = () => {
    setHasStarted(true);
    setCurrentIndex(0);
    setVisibleTranscripts([]);
    setIsComplete(false);
    setIsPaused(false);
    setStreamingStates({});
    onVisibleIndexChange?.(0);
  };

  const resetDemo = () => {
    streamingRef.current = false;
    setHasStarted(false);
    setVisibleTranscripts([]);
    setCurrentIndex(0);
    setIsStreaming(false);
    setIsPaused(false);
    setIsComplete(false);
    setStreamingStates({});
    onVisibleIndexChange?.(0);
  };

  const endDemo = () => {
    streamingRef.current = false;
    setIsPaused(false);
    
    // Show all transcripts immediately
    const allTranscripts = fullTranscripts.map(t => ({
      ...t,
      transcript: t.transcript // Show full text
    }));
    setVisibleTranscripts(allTranscripts);
    
    // Show all tags
    const finalStates = allTranscripts.reduce((acc, t) => {
      acc[t.timestamp] = { isStreaming: false, showTags: true };
      return acc;
    }, {} as { [key: string]: StreamingState });
    setStreamingStates(finalStates);
    
    // Set current index to end
    setCurrentIndex(fullTranscripts.length);
    onVisibleIndexChange?.(fullTranscripts.length);
    setIsComplete(true);
    onComplete?.(true);
  };

  const getSpeakerColorClass = (name: string) => {
    // Get just the first name
    const firstName = name.split(' ')[0];
    switch (firstName) {
      case 'Maria': return 'text-[#0088FE]';
      case 'Jack': return 'text-[#00C49F]';
      case 'Jamie': return 'text-[#9747FF]';
      case 'Annalece': return 'text-[#FF8042]';
      case 'Lisa': return 'text-[#8884D8]';
      default: return 'text-purple-600'; // AI Assistant
    }
  };

  useEffect(() => {
    const calculateHeight = () => {
      const viewportHeight = window.innerHeight;
      const transcriptContainer = document.querySelector('.transcript-container');
      const transcriptTop = transcriptContainer?.getBoundingClientRect().top || 0;
      const bottomPadding = 32; // 2rem
      const newHeight = viewportHeight - transcriptTop - bottomPadding;
      setTranscriptHeight(`${Math.max(300, newHeight)}px`);
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {!hasStarted ? (
            <button
              onClick={startDemo}
              className="px-3 py-1.5 text-sm rounded-lg font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              Start Demo
            </button>
          ) : (
            <>
              {!isComplete && (
                <button
                  onClick={endDemo}
                  className="px-3 py-1.5 text-sm rounded-lg font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  End Demo
                </button>
              )}
              <button
                onClick={resetDemo}
                className="px-3 py-1.5 text-sm rounded-lg font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Restart Demo
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">Powered by</span>
          <a 
            href="https://elevenlabs.io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image
              src="/elevenlabs-logo.png"
              alt="ElevenLabs"
              width={120}
              height={40}
              priority
            />
          </a>
        </div>
      </div>

      {isPaused && (
        <div className="text-sm text-gray-500 animate-pulse text-center mb-4">
          Demo paused
        </div>
      )}
      
      <div 
        className="transcript-container overflow-y-auto space-y-4 pr-4"
        style={{ maxHeight: transcriptHeight }}
      >
        {visibleTranscripts.map((t, i) => {
          const messageId = t.messageId || t.timestamp;
          const isCurrentlyPlaying = playingId === messageId;
          const isAIIntervention = t.isAIIntervention;

          return (
            <div 
              key={i} 
              className={`space-y-1 animate-fadeIn ${
                isAIIntervention ? 'pl-8' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`font-medium ${
                  isAIIntervention 
                    ? 'text-purple-600' 
                    : getSpeakerColorClass(t.name)
                }`}>
                  {isAIIntervention ? 'ElevenLabs AI Agent' : t.name.split(' ')[0]}
                </span>
                <span className="text-sm text-gray-400">
                  {new Date(t.timestamp).toLocaleTimeString()}
                </span>
                {isAIIntervention && (
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
                )}
              </div>
              <div className={`${
                isAIIntervention 
                  ? 'text-purple-600 italic' 
                  : 'text-gray-600'
              }`}>
                {t.analysis?.fallacies?.length > 0 && !isAIIntervention
                  ? highlightFallacy(t.transcript, t.analysis.fallacies)
                  : t.transcript
                }
              </div>
              {!isAIIntervention && streamingStates[t.timestamp]?.showTags && (
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
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
} 