'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import LiveTranscriptPanel from '@/components/LiveTranscriptPanel'
import AnalyticsPanel from '@/components/AnalyticsPanel'

const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const [transcripts, setTranscripts] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setLoading(true)
        logger.info('Checking API connection...');
        
        // First check if the API is available
        await axios.get(`${API_URL}`);
        
        logger.info('Fetching conversation...');
        const response = await axios.get(`${API_URL}/conversation`)
        setTranscripts(response.data)
        setError(null)
        logger.info('Conversation loaded successfully');
      } catch (error: any) {
        logger.error('Failed to fetch conversation:', error);
        if (error.code === 'ERR_NETWORK') {
          setError("Cannot connect to server. Please make sure the backend is running at " + API_URL)
        } else {
          setError(error.response?.data?.detail || "Failed to load conversation")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchConversation()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto p-6">
          <h1 className="text-3xl font-light">Meeting Intelligence</h1>
          <p className="text-gray-500">Conversation Analysis Demo</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-pulse text-gray-600">
              Loading conversation...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl">Conversation Transcript</h2>
                  <div className="space-x-3">
                    <button
                      disabled
                      className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                      title="Demo Mode - Using pre-recorded conversation"
                    >
                      Start Recording
                    </button>
                    <button
                      disabled
                      className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                      title="Demo Mode - Using pre-recorded conversation"
                    >
                      Stop Recording
                    </button>
                  </div>
                </div>
                <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                  Demo Mode: Analyzing a pre-recorded conversation
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
        )}
      </main>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 text-red-700 p-4 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
} 