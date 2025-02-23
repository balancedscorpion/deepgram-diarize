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
  const [visibleUpTo, setVisibleUpTo] = useState(0)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchDemoConversation()
  }, [])

  const fetchDemoConversation = async () => {
    try {
      const response = await axios.get(`${API_URL}/demo/conversation`)
      const rawTranscripts = response.data.map((t: any) => ({
        ...t,
        name: t.speaker === 'Speaker 1' ? 'Maria (Tech Lead)' 
           : t.speaker === 'Speaker 2' ? 'Jack (Frontend Dev)'
           : t.speaker === 'Speaker 3' ? 'Jamie (Backend Dev)'
           : t.speaker === 'Speaker 4' ? 'Annalece (QA Lead)'
           : t.name,
        speaker: t.speaker === 'Speaker 1' ? 'Maria' 
           : t.speaker === 'Speaker 2' ? 'Jack'
           : t.speaker === 'Speaker 3' ? 'Jamie'
           : t.speaker === 'Speaker 4' ? 'Annalece'
           : t.speaker
      }))
      
      // Insert AI interventions after controversial statements
      const enhancedTranscripts = []
      for (const transcript of rawTranscripts) {
        enhancedTranscripts.push(transcript)
        
        if (transcript.analysis?.controversial) {
          enhancedTranscripts.push({
            speaker: "ElevenLabs AI Agent",
            name: "ElevenLabs AI Agent",
            transcript: `Hey ${transcript.name.split(' ')[0]}! That statement seems controversial. Let's try to keep the discussion constructive and consider different perspectives.`,
            timestamp: new Date(new Date(transcript.timestamp).getTime() + 1000).toISOString(),
            isAIIntervention: true,
          })
        }
        
        if (transcript.analysis?.fallacies?.length > 0) {
          enhancedTranscripts.push({
            speaker: "ElevenLabs AI Agent",
            name: "ElevenLabs AI Agent",
            transcript: `I noticed a ${transcript.analysis.fallacies[0].type}. ${transcript.analysis.fallacies[0].explanation}`,
            timestamp: new Date(new Date(transcript.timestamp).getTime() + 1500).toISOString(),
            isAIIntervention: true,
          })
        }
      }
      
      setTranscripts(enhancedTranscripts)
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
          </div>
          <DemoTranscriptPanel 
            transcripts={transcripts} 
            onVisibleIndexChange={setVisibleUpTo}
          />
        </div>
      </div>

      <div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl mb-6">Analytics</h2>
          <AnalyticsPanel 
            transcripts={transcripts} 
            visibleUpTo={visibleUpTo}
          />
        </div>
      </div>
    </div>
  )
} 