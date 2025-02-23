'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

export default function MeetingObjective() {
  const [objective, setObjective] = useState<string>('Real-time transcription with analysis')

  const fetchObjective = async () => {
    try {
      const response = await axios.get('http://localhost:8000/demo/objective')
      if (response.data.objective_response) {
        try {
          const data = JSON.parse(response.data.objective_response)
          if (data && data[0] && data[0].Objective) {
            setObjective(data[0].Objective)
          }
        } catch (parseError) {
          // If it's not JSON, try to use the response directly
          setObjective(response.data.objective_response)
        }
      }
    } catch (error) {
      console.error('Error fetching objective:', error)
    }
  }

  useEffect(() => {
    fetchObjective() // Initial fetch
    
    // Set up interval to fetch every 5 seconds
    const interval = setInterval(fetchObjective, 5000)
    
    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [])

  return (
    <p className="mt-1">{objective}</p>
  )
} 