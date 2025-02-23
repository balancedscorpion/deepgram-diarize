interface Fallacy {
  type: string;
  segment: string;
  explanation: string;
}

interface Analysis {
  info_density: number;
  sentiment: number;
  controversial: boolean;
  fallacies: Fallacy[];
}

interface Transcript {
  speaker: string;
  name: string;
  transcript: string;
  timestamp: string;
  analysis: Analysis;
}

interface Props {
  transcripts: Transcript[];
}

export default function LiveTranscriptPanel({ transcripts }: Props) {
  const speakerColors = {
    "Speaker 1": "text-blue-600",
    "Speaker 2": "text-emerald-600",
    "Speaker 3": "text-purple-600",
    "Speaker 4": "text-orange-600",
    "Speaker 5": "text-yellow-600"
  };

  const highlightFallacy = (text: string, fallacies: Fallacy[]) => {
    let highlightedText = text;
    fallacies.forEach(fallacy => {
      highlightedText = highlightedText.replace(
        fallacy.segment,
        `<span class="bg-red-100 group relative cursor-help">
          ${fallacy.segment}
          <span class="hidden group-hover:block absolute bottom-full left-0 w-64 p-2 bg-white border rounded-lg shadow-lg text-sm">
            <strong>${fallacy.type}</strong><br/>
            ${fallacy.explanation}
          </span>
        </span>`
      );
    });
    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {transcripts.map((t, index) => {
        // Ensure analysis exists with default values
        const analysis = t.analysis || {
          info_density: 0,
          sentiment: 0,
          controversial: false,
          fallacies: []
        };

        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${speakerColors[t.speaker as keyof typeof speakerColors] || 'text-gray-600'}`}>
                {t.name || t.speaker}
              </span>
              <span className="text-sm text-gray-400">
                {new Date(t.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-gray-600">
              {analysis.fallacies?.length > 0 
                ? highlightFallacy(t.transcript, analysis.fallacies)
                : t.transcript
              }
            </div>
            <div className="flex gap-2 text-sm">
              {analysis.info_density > 0.8 && (
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                  High Density
                </span>
              )}
              {analysis.controversial && (
                <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">
                  Controversial
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 