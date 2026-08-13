import type { Summary } from '@/lib/types';
import { Sparkles, List, Loader2 } from 'lucide-react';

interface Props {
  summary: Summary | null;
  onGenerate?: () => void;
  generating?: boolean;
}

export default function SummaryPanel({ summary, onGenerate, generating }: Props) {
  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center animate-fade-in">
        <Sparkles className="h-8 w-8 text-slate-700 animate-pulse" />
        <p className="text-sm text-slate-500 mb-2">No summary available for this meeting.</p>
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4.5 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition active:scale-95 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Generate AI Summary
          </button>
        )}
      </div>
    );
  }

  const keyPoints = summary.key_points
    ? summary.key_points
        .split('\n')
        .map((l) => l.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      {/* Overview */}
      {summary.overview && (
        <div className="rounded-xl bg-white/4 border border-white/6 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">Overview</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">{summary.overview}</p>
        </div>
      )}

      {/* Key Points */}
      {keyPoints.length > 0 && (
        <div className="rounded-xl bg-white/4 border border-white/6 p-5">
          <div className="mb-3 flex items-center gap-2">
            <List className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Key Points</h3>
          </div>
          <ul className="space-y-2">
            {keyPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
