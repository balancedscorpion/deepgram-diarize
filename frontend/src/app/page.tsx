'use client'

import { useState, useRef } from 'react'
import axios from 'axios'

// Replace these with your own components or placeholders
import LiveTranscriptPanel from '@/components/LiveTranscriptPanel'
import AnalyticsPanel from '@/components/AnalyticsPanel'

export default function Home() {
  const [transcripts, setTranscripts] = useState<any[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Store the WebSocket instance so we can close it later
  const wsRef = useRef<WebSocket | null>(null)

  // Adjust to match your backend
  const wsUrl = 'ws://localhost:8000/ws'
  const startUrl = 'http://localhost:8000/start'
  const stopUrl = 'http://localhost:8000/stop'

  /**
   * Creates a new WebSocket connection and configures event handlers.
   */
  const openWebSocket = () => {
    // If there's an existing WS, close it before opening a new one
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
        // Debug: log the raw message
        console.log('Raw WS message:', event.data)
        try {
          // Parse the JSON payload, e.g. { transcript: "...", timestamp: "..." }
          const transcriptData = JSON.parse(event.data)
          console.log('Parsed transcriptData:', transcriptData)

          // Append this transcript chunk to our state array
          setTranscripts(prev => [...prev, transcriptData])
        } catch (parseErr) {
          console.error('Failed to parse WebSocket message:', parseErr)
        }
      }

      ws.onerror = (evt) => {
        console.error('WebSocket error:', evt)
        setError('Failed to connect to WebSocket server')
      }

      ws.onclose = () => {
        console.log('WebSocket closed.')
      }

      // Store the WebSocket in a ref
      wsRef.current = ws
    } catch (err) {
      console.error('Error creating WebSocket:', err)
      setError('Could not create WebSocket connection')
    }
  }

  /**
   * Handle "Start Recording"
   * 1) Clears transcripts, error
   * 2) Opens the WebSocket
   * 3) Calls /start on the backend
   */
  const handleStartRecording = async () => {
    setTranscripts([])
    setError(null)

    // Open the WS for receiving transcripts
    openWebSocket()

    // Call the backend to begin capturing audio
    try {
      await axios.post(startUrl)
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('Failed to start recording')
    }
  }

  /**
   * Handle "Stop Recording"
   * 1) Tells backend to stop
   * 2) Closes WebSocket
   * 3) Updates UI
   */
  const handleStopRecording = async () => {
    try {
      await axios.post(stopUrl)
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
          {/* Left column: Live Transcript Panel */}
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

          {/* Right column: Analytics Panel */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl mb-6">Analytics</h2>
              <AnalyticsPanel transcripts={transcripts} />
            </div>
          </div>
        </div>
      </main>

      {/* Error notification */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 text-red-700 p-4 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
}
