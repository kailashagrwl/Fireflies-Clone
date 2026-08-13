import type { Topic } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

interface Props {
  topics: Topic[];
  onSelectTopic?: (startSeconds: number) => void;
}

export default function TopicsPanel({ topics, onSelectTopic }: Props) {
  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <BookOpen className="h-8 w-8 text-slate-700" />
        <p className="text-sm text-slate-600">No topics/chapters for this meeting.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {topics.map((topic, i) => {
        const clickable = topic.start_seconds != null && onSelectTopic != null;
        return (
          <li
            key={topic.id}
            onClick={() => {
              if (clickable && topic.start_seconds != null && onSelectTopic) {
                onSelectTopic(topic.start_seconds);
              }
            }}
            className={`flex items-start gap-4 rounded-xl border border-white/6 bg-white/4 px-4 py-3 transition ${
              clickable
                ? 'cursor-pointer hover:border-violet-500/50 hover:bg-white/8'
                : ''
            }`}
          >
            {/* Chapter number */}
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-bold text-violet-300">
              {i + 1}
            </span>

            <div className="flex-1">
              <p className="text-sm font-medium text-slate-200">{topic.title}</p>
              {(topic.start_seconds != null || topic.end_seconds != null) && (
                <p className="mt-0.5 font-mono text-[11px] text-slate-600">
                  {topic.start_seconds != null && formatTimestamp(topic.start_seconds)}
                  {topic.start_seconds != null && topic.end_seconds != null && ' → '}
                  {topic.end_seconds != null && formatTimestamp(topic.end_seconds)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
