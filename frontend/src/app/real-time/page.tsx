'use client'

import { useState } from 'react'
import LiveTranscriptPanel from '@/components/LiveTranscriptPanel'
import AnalyticsPanel from '@/components/AnalyticsPanel'
import Link from 'next/link'
import LiveConversationPanel from '@/components/LiveConversationPanel'

const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

export default function RealTimePage() {
  const [transcripts, setTranscripts] = useState<any[]>([])

  const handleTranscriptUpdate = (text: string) => {
    setTranscripts(prev => [...prev, {
      speaker: "AI Agent",
      name: "AI Agent",
      transcript: text,
      timestamp: new Date().toISOString(),
      analysis: {
        info_density: 0.5,
        sentiment: 0,
        controversial: false,
        fallacies: []
      }
    }])
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <LiveConversationPanel onTranscriptUpdate={handleTranscriptUpdate} />
        </div>
      </div>

      <div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl mb-6">Analytics</h2>
          <AnalyticsPanel transcripts={transcripts} />
        </div>
      </div>
    </div>
  );
} 