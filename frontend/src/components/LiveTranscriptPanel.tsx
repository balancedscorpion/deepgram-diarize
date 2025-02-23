interface Transcript {
  speaker: string;
  transcript: string;
  timestamp: string;
  info_density?: number;
  fact_check?: boolean;
  controversial?: boolean;
}

interface Props {
  transcripts: Transcript[];
}

export default function LiveTranscriptPanel({ transcripts }: Props) {
  const speakerColors = {
    "Speaker 0": "text-blue-600",
    "Speaker 1": "text-emerald-600",
    "Speaker 2": "text-purple-600",
    "Speaker 3": "text-orange-600",
    "Speaker 4": "text-yellow-600",
    "Speaker 5": "text-indigo-600"
  };

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {transcripts.map((t, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${speakerColors[t.speaker as keyof typeof speakerColors] || 'text-gray-600'}`}>
              {t.speaker}
            </span>
            <span className="text-sm text-gray-400">
              {new Date(t.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-gray-600">{t.transcript}</p>
          <div className="flex gap-2 text-sm">
            {t.info_density && t.info_density > 0.8 && (
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                High Density
              </span>
            )}
            {t.fact_check === false && (
              <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded">
                Incorrect Fact
              </span>
            )}
            {t.controversial && (
              <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">
                Controversial
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 