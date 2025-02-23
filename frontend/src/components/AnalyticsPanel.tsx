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

// Add type for detailed views
type DetailedViews = {
  [key: string]: JSX.Element;
};

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

  // Update the cost efficiency data calculation
  const costEfficiencyData = useMemo(() => {
    const humanTranscripts = transcripts
      .filter(t => !t.isAIIntervention)
      .slice(0, visibleUpTo);

    // Count messages and calculate value metrics per person
    const messageStats: { [key: string]: any } = {};
    humanTranscripts.forEach(t => {
      const name = t.name.split(' ')[0];
      if (!messageStats[name]) {
        messageStats[name] = {
          messageCount: 0,
          highDensityCount: 0,
          totalDensity: 0,
          controversialCount: 0,
          fallacyCount: 0
        };
      }
      messageStats[name].messageCount++;
      messageStats[name].totalDensity += t.analysis?.info_density ?? 0;
      if (t.analysis?.info_density > 0.8) messageStats[name].highDensityCount++;
      if (t.analysis?.controversial) messageStats[name].controversialCount++;
      if (t.analysis?.fallacies?.length) messageStats[name].fallacyCount += t.analysis.fallacies.length;
    });

    return Object.entries(messageStats).map(([name, stats]) => {
      const avgDensity = stats.totalDensity / stats.messageCount;
      
      // Calculate value score (0-100)
      const valueScore = (
        (avgDensity * 40) + // 40% weight on information density
        (stats.highDensityCount / stats.messageCount * 30) + // 30% weight on high-value contributions
        ((1 - stats.fallacyCount / stats.messageCount) * 20) + // 20% weight on logical reasoning
        ((1 - stats.controversialCount / stats.messageCount) * 10) // 10% weight on non-controversial
      ).toFixed(1);

      // Calculate value for money (value score per $10k of salary)
      const valueForMoney = (parseFloat(valueScore) / (SALARY_DATA[name] / 10000)).toFixed(1);

      return {
        name,
        annualSalary: SALARY_DATA[name].toLocaleString(),
        valueScore,
        valueForMoney,
        highDensityRate: ((stats.highDensityCount / stats.messageCount) * 100).toFixed(1),
        fallacyRate: ((stats.fallacyCount / stats.messageCount) * 100).toFixed(1),
        participationRate: ((stats.messageCount / humanTranscripts.length) * 100).toFixed(1)
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
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={costEfficiencyData}
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="participationRate" fill="#82ca9d" name="Participation %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    ),
  };

  // Fix the detailed views object syntax
  const detailedViews: DetailedViews = {
    'Cost Efficiency': (
      <div className="h-[600px] flex flex-col">
        <div className="space-y-4 mb-6">
          <p className="text-gray-600">
            This analysis compares each participant&apos;s contribution value against their salary to determine meeting efficiency.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium">Metrics Explained:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><span className="font-medium">Value Score</span> - Overall contribution quality (0-100%) based on information density, high-value inputs, and logical reasoning</li>
              <li><span className="font-medium">Value per $10k</span> - How much value is delivered per $10,000 of salary (higher is better)</li>
              <li><span className="font-medium">High Density %</span> - Percentage of contributions that contained significant information</li>
              <li><span className="font-medium">Participation %</span> - Share of total meeting contributions</li>
            </ul>
            <p className="text-xs text-gray-500 mt-2">
              Rows highlighted in green indicate high value for money (&gt;1.0), while red indicates potential concerns (&lt;0.5).
            </p>
          </div>
        </div>

        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={costEfficiencyData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" label={{ value: 'Value Score', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Value per $10k Salary', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Bar yAxisId="left" dataKey="valueScore" fill="#82ca9d" name="Value Score" />
              <Bar yAxisId="right" dataKey="valueForMoney" fill="#8884d8" name="Value per $10k" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 overflow-y-auto flex-grow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2 px-3">Participant</th>
                <th className="text-right py-2 px-3">Annual Salary</th>
                <th className="text-right py-2 px-3">Value Score</th>
                <th className="text-right py-2 px-3">Value per $10k</th>
                <th className="text-right py-2 px-3">High Density %</th>
                <th className="text-right py-2 px-3">Participation %</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {costEfficiencyData.map((data) => (
                <tr key={data.name} className={`
                  ${parseFloat(data.valueForMoney) < 0.5 ? 'bg-red-50' : ''}
                  ${parseFloat(data.valueForMoney) > 1.0 ? 'bg-green-50' : ''}
                `}>
                  <td className="py-2 px-3">{data.name}</td>
                  <td className="text-right py-2 px-3">${data.annualSalary}</td>
                  <td className="text-right py-2 px-3">{data.valueScore}%</td>
                  <td className="text-right py-2 px-3">{data.valueForMoney}</td>
                  <td className="text-right py-2 px-3">{data.highDensityRate}%</td>
                  <td className="text-right py-2 px-3">{data.participationRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
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
          {selectedChart && (detailedViews[selectedChart as keyof typeof detailedViews] || allCharts[selectedChart])}
        </div>
      </Modal>
    </>
  );
} 