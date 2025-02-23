'use client'

import { useState } from 'react'
import RealtimePanel from '@/features/realtime/RealtimePanel'
import DemoPanel from '@/features/demo/DemoPanel'
import MeetingObjective from '@/components/MeetingObjective'

export default function Home() {
  const [isDemoMode, setIsDemoMode] = useState(true)

  const toggleMode = () => {
    setIsDemoMode(!isDemoMode)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={toggleMode}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Switch to {isDemoMode ? 'Real-time' : 'Demo'} Mode
        </button>
      </div>

      <MeetingObjective />
      
      {isDemoMode ? (
        <DemoPanel onSwitchMode={toggleMode} />
      ) : (
        <RealtimePanel onSwitchMode={toggleMode} />
      )}
    </div>
  )
} 