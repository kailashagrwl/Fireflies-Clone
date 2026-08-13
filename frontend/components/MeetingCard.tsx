import { formatDuration, formatDate } from '@/lib/utils';
import type { MeetingListItem } from '@/lib/types';
import { Calendar, Clock, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Props {
  meeting: MeetingListItem;
}

/** Returns a deterministic colour class from a name string for avatar initials. */
function avatarColor(name: string) {
  const colours = [
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
  return colours[Math.abs(hash) % colours.length];
}

export default function MeetingCard({ meeting }: Props) {
  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#13151d] p-5 transition-all duration-200 hover:border-violet-500/30 hover:bg-[#161924] hover:shadow-lg hover:shadow-violet-950/30"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-snug text-white group-hover:text-violet-200 transition-colors">
          {meeting.title}
        </h3>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-600 group-hover:text-violet-400 transition-colors" />
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        {meeting.meeting_date && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            {formatDate(meeting.meeting_date)}
          </span>
        )}
        {meeting.duration_seconds != null && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-600" />
            {formatDuration(meeting.duration_seconds)}
          </span>
        )}
        {meeting.participants.length > 0 && (
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-600" />
            {meeting.participants.length} participant
            {meeting.participants.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Participant avatars */}
      {meeting.participants.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {meeting.participants.slice(0, 5).map((p) => (
              <div
                key={p.id}
                title={p.name}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-[#13151d] ${avatarColor(p.name)}`}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {meeting.participants.length > 5 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-slate-300 ring-2 ring-[#13151d]">
                +{meeting.participants.length - 5}
              </div>
            )}
          </div>
          <span className="text-[11px] text-slate-600">
            {meeting.participants
              .slice(0, 2)
              .map((p) => p.name.split(' ')[0])
              .join(', ')}
            {meeting.participants.length > 2 &&
              ` +${meeting.participants.length - 2} more`}
          </span>
        </div>
      )}
    </Link>
  );
}
