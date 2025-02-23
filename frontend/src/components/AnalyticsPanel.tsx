'use client'

import { useMemo, useState } from 'react'
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
  Bar,
  ReferenceLine
} from 'recharts'
import { XMarkIcon } from '@heroicons/react/24/solid'

interface Props {
  transcripts: any[];
  visibleUpTo?: number;
}

interface SalaryData {
  [key: string]: number;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

function Modal({ isOpen, onClose, children, title }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-medium">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPanel({ transcripts, visibleUpTo = 0 }: Props) {
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const CHARTS_PER_PAGE = 4;

  const sentimentData = useMemo(() => {
    const humanTranscripts = transcripts
      .filter(t => !t.isAIIntervention)
      .slice(0, visibleUpTo);
    
    const timePoints = [...new Set(humanTranscripts.map(t => t.timestamp))].sort();
    
    const speakerData: { [key: string]: { [key: string]: number } } = {};
    
    humanTranscripts.forEach(t => {
      // Remove the role/title from the name
      const name = t.name.split(' ')[0];
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
  }, [transcripts, visibleUpTo]);

  const SPEAKER_COLORS = {
    'Maria': '#0088FE',    // Blue
    'Jack': '#00C49F',     // Green
    'Jamie': '#9747FF',    // Purple
    'Annalece': '#FF8042', // Orange
    'Lisa': '#8884D8',     // Light purple
    'AI Assistant': '#B4B4B4' // Gray
  };

  const speakers = useMemo(() => 
    [...new Set(transcripts
      .filter(t => !t.isAIIntervention)
      .map(t => t.name.split(' ')[0]))]
  , [transcripts]);

  const densityData = useMemo(() => 
    transcripts
      .slice(0, visibleUpTo)
      .map(t => ({
        timestamp: new Date(t.timestamp).toLocaleTimeString(),
        density: t.analysis?.info_density ?? 0.5
      }))
  , [transcripts, visibleUpTo]);

  const speakerContribution = useMemo(() => {
    const counts: { [key: string]: number } = {}
    transcripts
      .slice(0, visibleUpTo)
      .forEach(t => {
        const name = t.name.split(' ')[0]
        counts[name] = (counts[name] || 0) + 1
      })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [transcripts, visibleUpTo]);

  const fallacyTypes = useMemo(() => {
    const types: { [key: string]: number } = {}
    transcripts
      .slice(0, visibleUpTo)
      .forEach(t => {
        t.analysis?.fallacies?.forEach((f: any) => {
          types[f.type] = (types[f.type] || 0) + 1
        })
      })
    return Object.entries(types).map(([type, count]) => ({ type, count }))
  }, [transcripts, visibleUpTo]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

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

  // Add lexical density data calculation
  const lexicalDensityData = useMemo(() => {
    const humanTranscripts = transcripts
      .filter(t => !t.isAIIntervention)
      .slice(0, visibleUpTo);

    // Simulate lexical density data
    return humanTranscripts.map((t, i) => {
      // Generate a realistic-looking lexical density value
      // Base it on transcript length and some randomness
      const baseValue = 0.5; // 50% base lexical density
      const lengthFactor = Math.min(t.transcript.length / 100, 0.3); // Longer messages tend to have higher density
      const randomFactor = Math.random() * 0.2 - 0.1; // ±10% random variation
      
      return {
        timestamp: new Date(t.timestamp).toLocaleTimeString(),
        density: Math.min(Math.max(baseValue + lengthFactor + randomFactor, 0.3), 0.8), // Keep between 30-80%
        speaker: t.name.split(' ')[0]
      };
    });
  }, [transcripts, visibleUpTo]);

  // Add mock salary data (annual salaries)
  const SALARY_DATA: SalaryData = {
    'Maria': 150000,    // Tech Lead
    'Jack': 120000,     // Frontend Dev
    'Jamie': 125000,    // Backend Dev
    'Annalece': 110000, // QA Lead
    'Lisa': 130000      // Product Owner
  };

  // Calculate cost per contribution
  const costEfficiencyData = useMemo(() => {
    const humanTranscripts = transcripts
      .filter(t => !t.isAIIntervention)
      .slice(0, visibleUpTo);

    // Count messages per person
    const messageCount: { [key: string]: number } = {};
    humanTranscripts.forEach(t => {
      const name = t.name.split(' ')[0];
      messageCount[name] = (messageCount[name] || 0) + 1;
    });

    // Calculate meeting duration in hours (assume it's a 1-hour meeting for demo)
    const MEETING_DURATION = 1;

    // Calculate cost per message and participation metrics
    return Object.entries(messageCount).map(([name, count]) => {
      const hourlyRate = SALARY_DATA[name] / (52 * 40); // weekly hours * weeks per year
      const meetingCost = hourlyRate * MEETING_DURATION;
      const participationPercentage = count / humanTranscripts.length;
      const costPerMessage = meetingCost / count;

      return {
        name,
        messagesPerHour: count / MEETING_DURATION,
        costPerMessage: costPerMessage.toFixed(2),
        participationRate: (participationPercentage * 100).toFixed(1),
        meetingCost: meetingCost.toFixed(2),
        messageCount: count
      };
    });
  }, [transcripts, visibleUpTo]);

  const allCharts = {
    'Sentiment Over Time': (
      <div className="h-[200px]">
        <div className="h-full flex flex-col">
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
              {speakers.map((speaker) => (
                <Line
                  key={speaker}
                  type="monotone"
                  dataKey={speaker}
                  stroke={SPEAKER_COLORS[speaker as keyof typeof SPEAKER_COLORS]}
                  dot={{ fill: SPEAKER_COLORS[speaker as keyof typeof SPEAKER_COLORS] }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    ),
    'Information Density': (
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={densityData} 
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp"
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis domain={[0, 1]} />
            <Tooltip />
            <Bar dataKey="density" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    ),
    'Speaker Contribution': (
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <Pie
              data={speakerContribution}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
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
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    ),
    'Fallacy Types': (
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={fallacyTypes}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="type" type="category" width={150} />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    ),
    'Lexical Density': (
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lexicalDensityData}>
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
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip 
              formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Density']}
              contentStyle={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '8px',
                border: '1px solid #e5e7eb'
              }}
            />
            <Line
              type="monotone"
              dataKey="density"
              stroke="#8884d8"
              dot={{ fill: '#8884d8' }}
            />
            {/* Add a reference line for average density */}
            <ReferenceLine 
              y={lexicalDensityData.reduce((acc, curr) => acc + curr.density, 0) / lexicalDensityData.length} 
              stroke="red" 
              strokeDasharray="3 3"
              label={{ 
                value: 'Average',
                position: 'right',
                fill: 'red',
                fontSize: 12
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    ),
    'Cost Efficiency': (
      <div className="h-[200px]">
        <div className="h-full flex flex-col">
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%" minHeight={100}>
              <BarChart 
                data={costEfficiencyData} 
                margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="costPerMessage" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="participationRate" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[30%] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Participant</th>
                  <th className="text-right py-2">Messages</th>
                  <th className="text-right py-2">Cost/Message</th>
                  <th className="text-right py-2">Participation</th>
                  <th className="text-right py-2">Meeting Cost</th>
                </tr>
              </thead>
              <tbody>
                {costEfficiencyData.map((data) => (
                  <tr key={data.name} className="border-b">
                    <td className="py-2">{data.name}</td>
                    <td className="text-right">{data.messageCount}</td>
                    <td className="text-right">${data.costPerMessage}</td>
                    <td className="text-right">{data.participationRate}%</td>
                    <td className="text-right">${data.meetingCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),
  };

  // Add debug logging
  console.log({
    densityData,
    speakerContribution,
    fallacyTypes,
    costEfficiencyData
  });

  const chartEntries = Object.entries(allCharts);
  const totalPages = Math.ceil(chartEntries.length / CHARTS_PER_PAGE);
  const currentCharts = chartEntries.slice(
    currentPage * CHARTS_PER_PAGE,
    (currentPage + 1) * CHARTS_PER_PAGE
  );

  // Add empty state for charts when no data
  const hasData = visibleUpTo > 0;

  return (
    <>
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-8">
          {currentCharts.map(([title, chart]) => (
            <div 
              key={title}
              className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedChart(title)}
            >
              <h3 className="text-lg font-medium mb-4 text-center">{title}</h3>
              <div className="h-[180px]">
                {hasData ? chart : (
                  <div className="text-gray-400 text-center">
                    Start the demo to see data
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 0}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                currentPage === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Previous
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              Page {currentPage + 1} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages - 1}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                currentPage === totalPages - 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={selectedChart !== null}
        onClose={() => setSelectedChart(null)}
        title={selectedChart || ''}
      >
        <div className="h-[600px]">
          {selectedChart && allCharts[selectedChart]}
        </div>
      </Modal>
    </>
  );
} 