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
  const [isComplete, setIsComplete] = useState(false)

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
    <div className="space-y-6">
      {/* Final Awards Panel - appears when demo is complete */}
      {isComplete && (
        <div className="bg-white rounded-2xl shadow-sm p-6 animate-slideDown">
          <h2 className="text-xl mb-4">Meeting Awards 🎖️</h2>
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="text-center p-3">
              <img 
                src="/badges/hippo.png"
                alt="HIPPO Award"
                className="w-16 h-16 mx-auto mb-2"
              />
              <h3 className="font-medium text-base mb-1">HIPPO Award</h3>
              <p className="text-xs text-gray-600 mb-1">Highest Paid Person's Opinion</p>
              <div className="text-blue-600 font-medium text-sm">Maria</div>
            </div>
            <div className="text-center p-3">
              <img 
                src="/badges/zebra.png"
                alt="ZEBRA Award"
                className="w-16 h-16 mx-auto mb-2"
              />
              <h3 className="font-medium text-base mb-1">ZEBRA Award</h3>
              <p className="text-xs text-gray-600 mb-1">Zero Evidence but Really Arrogant</p>
              <div className="text-blue-600 font-medium text-sm">Jamie</div>
            </div>
            <div className="text-center p-3">
              <img 
                src="/badges/rhino.png"
                alt="RHINO Award"
                className="w-16 h-16 mx-auto mb-2"
              />
              <h3 className="font-medium text-base mb-1">RHINO Award</h3>
              <p className="text-xs text-gray-600 mb-1">Really High value, New Opportunity</p>
              <div className="text-blue-600 font-medium text-sm">Jack</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl">Demo Conversation</h2>
            </div>
            <DemoTranscriptPanel 
              transcripts={transcripts} 
              onVisibleIndexChange={setVisibleUpTo}
              onComplete={setIsComplete}
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
    </div>
  )
} 