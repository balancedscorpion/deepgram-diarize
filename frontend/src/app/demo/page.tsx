'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import LiveTranscriptPanel from '@/components/LiveTranscriptPanel'
import AnalyticsPanel from '@/components/AnalyticsPanel'
import Link from 'next/link'
import DemoTranscriptPanel from '@/components/DemoTranscriptPanel'

export default function DemoPage() {
  const [transcripts, setTranscripts] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchDemoConversation()
  }, [])

  const fetchDemoConversation = async () => {
    try {
      const response = await axios.get(`${API_URL}/demo/conversation`)
      setTranscripts(response.data)
      setError(null)
    } catch (error: any) {
      console.error('Failed to fetch demo conversation:', error)
      setError(error.response?.data?.detail || "Failed to load demo conversation")
    } finally {
      setInitialLoad(false)
    }
  }

  if (initialLoad) {
    return (
      <div className="text-center py-10">
        <div className="animate-pulse text-gray-600">
          Loading demo conversation...
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl">Demo Conversation</h2>
            <Link
              href="/real-time"
              className="px-4 py-2 rounded-lg font-medium bg-purple-50 text-purple-600 hover:bg-purple-100"
            >
              Switch to Live Mode
            </Link>
          </div>
          <DemoTranscriptPanel transcripts={transcripts} />
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