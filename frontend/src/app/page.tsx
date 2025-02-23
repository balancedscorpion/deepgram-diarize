'use client'

import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import LiveTranscriptPanel from '@/components/LiveTranscriptPanel'
import AnalyticsPanel from '@/components/AnalyticsPanel'

const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

export default function Home() {
  const [transcripts, setTranscripts] = useState<any[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    logger.info('Initializing WebSocket connection...');
    wsRef.current = new WebSocket('ws://localhost:8000/ws')
    
    wsRef.current.onopen = () => {
      logger.info('WebSocket connection established');
    };
    
    wsRef.current.onmessage = (event) => {
      const transcript = JSON.parse(event.data)
      logger.debug('Received transcript:', transcript);
      setTranscripts(prev => [...prev, transcript])
    }

    wsRef.current.onerror = (error) => {
      logger.error('WebSocket error:', error)
      setError('Failed to connect to WebSocket server')
    }

    wsRef.current.onclose = () => {
      logger.info('WebSocket connection closed');
    };

    return () => {
      logger.info('Cleaning up WebSocket connection...');
      wsRef.current?.close()
    }
  }, [])

  const handleStartRecording = async () => {
    try {
      logger.info('Starting recording...');
      await axios.post('http://localhost:8000/start')
      setIsRecording(true)
      setError(null)
      setTranscripts([])
      logger.info('Recording started successfully');
    } catch (error) {
      logger.error('Failed to start recording:', error);
      setError("Failed to start recording")
    }
  }

  const handleStopRecording = async () => {
    try {
      logger.info('Stopping recording...');
      await axios.post('http://localhost:8000/stop')
      setIsRecording(false)
      setError(null)
      logger.info('Recording stopped successfully');
    } catch (error) {
      logger.error('Failed to stop recording:', error);
      setError("Failed to stop recording")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto p-6">
          <h1 className="text-3xl font-light">Meeting Intelligence</h1>
          <p className="text-gray-500">Real-time transcription and analytics</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl">Live Transcript</h2>
                <div className="space-x-3">
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
        </div>
      </main>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 text-red-700 p-4 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
} 