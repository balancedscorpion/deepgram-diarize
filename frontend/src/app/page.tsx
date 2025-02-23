'use client'

import { useState, useRef } from 'react'
import axios from 'axios'
import LiveTranscriptPanel from '@/components/LiveTranscriptPanel'
import AnalyticsPanel from '@/components/AnalyticsPanel'

export default function Home() {
  const [transcripts, setTranscripts] = useState<any[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // We'll store the WebSocket instance here
  const wsRef = useRef<WebSocket | null>(null)

  // Adjust these URLs to match your local server
  const wsUrl = 'ws://localhost:8000/ws'
  const apiBase = 'http://localhost:8000'  // for /start, /stop endpoints

  const openWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    try {
      const ws = new WebSocket(wsUrl)
      ws.onopen = () => {
        console.log('WebSocket connected.')
      }
      ws.onmessage = (event) => {
        try {
          // e.g. { speaker: "Speaker 0", transcript: "Hello", timestamp: "..." }
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

    // 1) Connect to the WebSocket
    openWebSocket()

    // 2) Call /start
    try {
      await axios.post(`${apiBase}/start`)
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('Failed to start recording')
    }
  }

  const handleStopRecording = async () => {
    // Tell server to stop
    try {
      await axios.post(`${apiBase}/stop`)
    } catch (err) {
      console.error('Failed to stop recording:', err)
      setError('Failed to stop recording')
    }
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsRecording(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto p-6">
          <h1 className="text-3xl font-light">Meeting Intelligence</h1>
          <p className="text-gray-500">Real-time transcription with speaker diarization</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Transcript Panel */}
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

          {/* Analytics */}
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
