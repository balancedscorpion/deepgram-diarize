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
import { useMemo, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

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
  transcripts: Transcript[];
}

export default function AnalyticsPanel({ transcripts }: Props) {
  const [currentChart, setCurrentChart] = useState(0)

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

  const charts = [
    {
      title: "Information Density",
      component: <Bar data={infoDensityData} options={chartOptions} />,
    },
    {
      title: "Sentiment Analysis",
      component: <Line data={sentimentData} options={chartOptions} />,
    },
    {
      title: "Speaker Contribution",
      component: <Pie data={speakerContributionData} options={chartOptions} />,
    },
  ]

  const nextChart = () => {
    setCurrentChart((prev) => (prev + 1) % charts.length)
  }

  const previousChart = () => {
    setCurrentChart((prev) => (prev - 1 + charts.length) % charts.length)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Analytics</h2>
      
      <div className="bg-white rounded-xl p-6 relative min-h-[400px]">
        {/* Chart Title */}
        <h3 className="text-gray-700 font-medium text-center mb-4">
          {charts[currentChart].title}
        </h3>

        {/* Navigation Buttons */}
        <button
          onClick={previousChart}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 
                     bg-gray-100 hover:bg-gray-200 rounded-full p-2"
          aria-label="Previous chart"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>

        <button
          onClick={nextChart}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 
                     bg-gray-100 hover:bg-gray-200 rounded-full p-2"
          aria-label="Next chart"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>

        {/* Chart Display */}
        <div className="px-8">
          {charts[currentChart].component}
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center space-x-2 mt-4">
          {charts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentChart(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                currentChart === index ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              aria-label={`Go to chart ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 