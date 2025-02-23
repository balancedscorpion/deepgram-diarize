'use client'

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import LiveTranscriptPanel from '@/components/LiveTranscriptPanel'
import AnalyticsPanel from '@/components/AnalyticsPanel'

interface Props {
  onSwitchMode: () => void;
}

export default function RealtimePanel({ onSwitchMode }: Props) {
  const [transcripts, setTranscripts] = useState<any[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)

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
        console.log('WebSocket connected.')
      }
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setTranscripts(prev => [...prev, data])
        } catch (err) {
          console.error('Failed to parse message:', err)
        }
      }
      ws.onerror = (err) => {
        console.error('WebSocket error:', err)
        setError('Failed to connect to WebSocket server')
      }
      ws.onclose = () => {
        console.log('WebSocket closed.')
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Error creating WebSocket:', err)
      setError('Could not create WebSocket connection')
    }
  }

  const handleStartRecording = async () => {
    setTranscripts([])
    setError(null)

    openWebSocket()

    try {
      await axios.post(`${API_URL}/real-time/start`)
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('Failed to start recording')
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
      console.error('Failed to stop recording:', err)
      setError('Failed to stop recording')
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsRecording(false)
  }

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
              <button
                onClick={onSwitchMode}
                className="px-4 py-2 rounded-lg font-medium bg-purple-50 text-purple-600 hover:bg-purple-100"
              >
                Switch to Demo Mode
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
  )
} 