'use client'

import { useMemo } from 'react'
import AnalyticsCarousel from './AnalyticsCarousel'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

interface Props {
  transcripts: any[]
}

export default function AnalyticsPanel({ transcripts }: Props) {
  const sentimentData = useMemo(() => {
    const timePoints = [...new Set(transcripts.map(t => t.timestamp))].sort();
    
    const speakerData: { [key: string]: { [key: string]: number } } = {};
    
    transcripts.forEach(t => {
      const name = t.name.split(' (')[0];
      const time = new Date(t.timestamp).toLocaleTimeString();
      if (!speakerData[name]) {
        speakerData[name] = {};
      }
      speakerData[name][time] = t.analysis?.sentiment ?? 0;
    });

    return timePoints.map(timestamp => {
      const time = new Date(timestamp).toLocaleTimeString();
      const point: any = { timestamp: time };
      Object.keys(speakerData).forEach(speaker => {
        point[speaker] = speakerData[speaker][time] ?? 0;
      });
      return point;
    });
  }, [transcripts]);

  const speakers = useMemo(() => 
    [...new Set(transcripts.map(t => t.name.split(' (')[0]))]
  , [transcripts]);

  // Define a wider range of colors for different speakers
  const COLORS = [
    '#0088FE',  // Blue
    '#00C49F',  // Green
    '#FFBB28',  // Yellow
    '#FF8042',  // Orange
    '#8884D8',  // Purple
    '#FF6B6B',  // Red
    '#4ECDC4',  // Teal
    '#45B7D1',  // Light Blue
    '#96CEB4',  // Mint
    '#D4A5A5'   // Rose
  ];

  // Dynamically assign colors to speakers
  const SPEAKER_COLORS = useMemo(() => {
    const colors: { [key: string]: string } = {};
    speakers.forEach((speaker, index) => {
      colors[speaker] = COLORS[index % COLORS.length];
    });
    return colors;
  }, [speakers]);

  const densityData = useMemo(() => 
    transcripts.map(t => ({
      timestamp: new Date(t.timestamp).toLocaleTimeString(),
      density: t.analysis?.info_density ?? 0.5
    })), [transcripts]
  )

  const speakerContribution = useMemo(() => {
    const counts: { [key: string]: number } = {}
    transcripts.forEach(t => {
      const name = t.name.split(' (')[0]
      counts[name] = (counts[name] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [transcripts])

  const fallacyTypes = useMemo(() => {
    const types: { [key: string]: number } = {}
    transcripts.forEach(t => {
      t.analysis?.fallacies?.forEach((f: any) => {
        types[f.type] = (types[f.type] || 0) + 1
      })
    })
    return Object.entries(types).map(([type, count]) => ({ type, count }))
  }, [transcripts])

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, name, value, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm"
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <AnalyticsCarousel>
      {/* Sentiment Analysis Chart */}
      <div className="h-full flex flex-col">
        <h3 className="text-lg font-medium mb-4 text-center">Sentiment Over Time</h3>
        <div className="mb-4 flex justify-center gap-4 flex-wrap">
          {speakers.map(speaker => (
            <div key={speaker} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: SPEAKER_COLORS[speaker as keyof typeof SPEAKER_COLORS] }}
              />
              <span className="text-sm text-gray-600">{speaker}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sentimentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp"
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[-1, 1]} 
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '8px',
                border: '1px solid #e5e7eb'
              }}
            />
            {speakers.map(speaker => (
              <Line
                key={speaker}
                type="monotone"
                dataKey={speaker}
                stroke={SPEAKER_COLORS[speaker as keyof typeof SPEAKER_COLORS]}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Information Density Chart */}
      <div className="h-full flex flex-col">
        <h3 className="text-lg font-medium mb-4 text-center">Information Density</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={densityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis domain={[0, 1]} />
            <Tooltip />
            <Bar dataKey="density" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Speaker Contribution Pie Chart */}
      <div className="h-full flex flex-col">
        <h3 className="text-lg font-medium mb-4 text-center">Speaker Contribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={speakerContribution}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              labelLine={true}
              label={renderCustomizedLabel}
            >
              {speakerContribution.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [`${value} messages`, name]}
              contentStyle={{ 
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '8px',
                border: '1px solid #e5e7eb'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Fallacy Types Chart */}
      <div className="h-full flex flex-col">
        <h3 className="text-lg font-medium mb-4 text-center">Fallacy Types</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={fallacyTypes} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="type" type="category" width={150} />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsCarousel>
  )
} 