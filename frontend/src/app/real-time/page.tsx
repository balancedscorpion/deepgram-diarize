'use client'

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import LiveTranscriptPanel from '@/components/LiveTranscriptPanel'
import AnalyticsPanel from '@/components/AnalyticsPanel'
import Link from 'next/link'

const logger = {
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  debug: (...args: unknown[]) => console.debug('[DEBUG]', ...args),
};

interface Transcript {
  speaker: string;
  name: string;
  transcript: string;
  timestamp: string;
  analysis: {
    info_density: number;
    sentiment: number;
    controversial: boolean;
    fallacies: Array<{
      type: string;
      segment: string;
      explanation: string;
    }>;
  };
}

export default function RealTimePage() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const transcriptsRef = useRef<Transcript[]>([])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

  const openWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    try {
      const ws = new WebSocket(`${WS_URL}/real-time/ws`)
      ws.onopen = () => {
        logger.info('WebSocket connected.')
      }
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          // Keep local ref updated
          transcriptsRef.current = [...transcriptsRef.current, data]
          // Update state
          setTranscripts(prev => [...prev, data])
        } catch (err) {
          logger.error('Failed to parse message:', err)
        }
      }
      ws.onerror = (event) => {
        if (event instanceof ErrorEvent) {
          logger.error('WebSocket error:', event.error)
        } else {
          logger.error('WebSocket error event:', event)
        }
        setError('Failed to connect to WebSocket server')
      }
      ws.onclose = () => {
        logger.info('WebSocket closed.')
      }

      wsRef.current = ws
    } catch (err) {
      logger.error('Error creating WebSocket:', err)
      setError('Could not create WebSocket connection')
    }
  }

  const handleStartRecording = async () => {
    // Clear transcripts when starting new recording
    setTranscripts([])
    transcriptsRef.current = []
    setError(null)

    openWebSocket()

    try {
      const response = await axios.post(`${API_URL}/real-time/start`)
      logger.info('Recording started successfully:', response.data)
      setIsRecording(true)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to start recording'
        logger.error('Failed to start recording:', {
          message: errorMessage,
          status: err.response?.status,
          url: `${API_URL}/real-time/start`
        })
        setError(errorMessage)
      } else {
        logger.error('Unexpected error:', err)
        setError('An unexpected error occurred')
      }
      
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }

  const handleStopRecording = async () => {
    try {
      await axios.post(`${API_URL}/real-time/stop`)
    } catch (err) {
      logger.error('Failed to stop recording:', err)
      setError('Failed to stop recording')
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsRecording(false)
  }

  const handleClearMemory = async () => {
    try {
      await axios.post(`${API_URL}/real-time/clear-memory`)
      setTranscripts([])
      transcriptsRef.current = []
      logger.info('Transcript memory cleared')
    } catch (err) {
      logger.error('Failed to clear transcript memory:', err)
      setError('Failed to clear transcript memory')
    }
  }

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl">Live Transcript</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleStartRecording}
                disabled={isRecording}
                className={`px-4 py-2 rounded-lg font-medium transition-colors
                  ${isRecording 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
              >
                Start Recording
              </button>
              <button
                onClick={handleStopRecording}
                disabled={!isRecording}
                className={`px-4 py-2 rounded-lg font-medium transition-colors
                  ${!isRecording
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
              >
                Stop Recording
              </button>
              <button
                onClick={handleClearMemory}
                disabled={isRecording}
                className={`px-4 py-2 rounded-lg font-medium transition-colors
                  ${isRecording
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'}`}
              >
                Clear Memory
              </button>
              <Link
                href="/demo"
                className="inline-flex items-center px-4 py-2 rounded-lg font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
              >
                Switch to Demo Mode
              </Link>
            </div>
          </div>
          <LiveTranscriptPanel transcripts={transcripts} />
        </div>
      </div>

      <div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl mb-6">Analytics</h2>
          <AnalyticsPanel transcripts={transcripts} />
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 text-red-700 p-4 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
} 