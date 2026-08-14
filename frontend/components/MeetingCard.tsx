import { formatDuration, formatDate } from '@/lib/utils';
import type { MeetingListItem } from '@/lib/types';
import { Calendar, Clock, Users, ChevronRight, Play } from 'lucide-react';
import Link from 'next/link';

interface Props {
  meeting: MeetingListItem;
}

/** Returns a deterministic color class from a name string for avatar initials. */
function avatarColor(name: string) {
  const colors = [
    'bg-violet-500',
    'bg-indigo-500',
    'bg-sky-500',
    'bg-teal-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-pink-500',
  ];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffff;
  return colors[Math.abs(hash) % colors.length];
}

export default function MeetingCard({ meeting }: Props) {
  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-3xs transition-all duration-200 hover:border-violet-300 hover:shadow-md hover:shadow-violet-100/50"
    >
      <div className="space-y-3">
        {/* Title and Arrow */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold leading-snug text-slate-800 group-hover:text-violet-600 transition-colors">
            {meeting.title}
          </h3>
          <div className="mt-0.5 rounded-full p-1 bg-slate-50 text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-500 transition-colors">
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Date / Time Metadata */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
          {meeting.meeting_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {formatDate(meeting.meeting_date)}
            </span>
          )}
          {meeting.duration_seconds != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {formatDuration(meeting.duration_seconds)}
            </span>
          )}
        </div>
      </div>

      {/* Footer Info / Avatars */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
        {meeting.participants.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {meeting.participants.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  title={p.name}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white ${avatarColor(p.name)}`}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {meeting.participants.length > 4 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-500 ring-2 ring-white">
                  +{meeting.participants.length - 4}
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium text-slate-400 truncate max-w-28">
              {meeting.participants
                .slice(0, 2)
                .map((p) => p.name.split(' ')[0])
                .join(', ')}
              {meeting.participants.length > 2 && '...'}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400">No participants</span>
        )}

        {/* Play Icon Indicator */}
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
          <Play className="h-2.5 w-2.5 fill-current" />
        </div>
      </div>
    </Link>
  );
}
