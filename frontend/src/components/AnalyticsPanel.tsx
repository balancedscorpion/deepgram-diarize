'use client'

import { Bar, Line, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { useMemo } from 'react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

interface Props {
  transcripts: any[];
}

export default function AnalyticsPanel({ transcripts }: Props) {
  const infoDensityData = useMemo(() => ({
    labels: ['Speaker 1', 'Speaker 2', 'Speaker 3'],
    datasets: [{
      label: 'Information Density',
      data: [0.8, 0.6, 0.4],
      backgroundColor: 'rgba(54, 162, 235, 0.5)'
    }]
  }), [])

  const sentimentData = useMemo(() => ({
    labels: transcripts.map(t => new Date(t.timestamp).toLocaleTimeString()),
    datasets: [{
      label: 'Sentiment',
      data: transcripts.map(() => Math.random() * 2 - 1),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  }), [transcripts])

  const speakerContributionData = useMemo(() => {
    const counts: { [key: string]: number } = {}
    transcripts.forEach(t => {
      counts[t.speaker] = (counts[t.speaker] || 0) + t.transcript.split(' ').length
    })
    return {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ]
      }]
    }
  }, [transcripts])

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-gray-700 font-medium mb-4">Information Density</h3>
          <Bar data={infoDensityData} options={chartOptions} />
        </div>
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-gray-700 font-medium mb-4">Sentiment Analysis</h3>
          <Line data={sentimentData} options={chartOptions} />
        </div>
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-gray-700 font-medium mb-4">Speaker Contribution</h3>
          <Pie data={speakerContributionData} options={chartOptions} />
        </div>
      </div>
    </div>
  )
} 