'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import type { TranscriptSegment } from '@/lib/types';
import { formatTimestamp, highlight, avatarColor, initials } from '@/lib/utils';
import { Search, X } from 'lucide-react';

interface Props {
  segments: TranscriptSegment[];
  jumpToTime?: number | null;
  currentTime?: number;
  onSegmentClick?: (seconds: number) => void;
}

export default function TranscriptPanel({ segments, jumpToTime, currentTime, onSegmentClick }: Props) {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<number | null>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeId !== null) {
      activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeId]);

  // Synchronize activeId with currentTime from the media player
  useEffect(() => {
    if (currentTime !== undefined && currentTime !== null) {
      const activeSeg = segments.find((seg, index) => {
        const start = seg.start_seconds ?? 0;
        const nextSeg = segments[index + 1];
        const end = seg.end_seconds ?? (nextSeg?.start_seconds ?? Infinity);
        return currentTime >= start && currentTime < end;
      });
      if (activeSeg) {
        setActiveId(activeSeg.id);
      }
    }
  }, [currentTime, segments]);

  // Jump to segment corresponding to jumpToTime
  useEffect(() => {
    if (jumpToTime !== undefined && jumpToTime !== null) {
      // Find first segment starting after or at the jumpToTime
      const match =
        segments.find(
          (s) => s.start_seconds !== null && s.start_seconds >= jumpToTime
        ) || segments[0];
      if (match) {
        setActiveId(match.id);
      }
    }
  }, [jumpToTime, segments]);

  const filtered = useMemo(() => {
    if (!query.trim()) return segments;
    const q = query.toLowerCase();
    return segments.filter(
      (s) =>
        s.text.toLowerCase().includes(q) ||
        (s.speaker_name?.toLowerCase().includes(q) ?? false)
    );
  }, [segments, query]);

  const matchCount = query.trim() ? filtered.length : null;

  return (
    <div className="flex h-full flex-col">
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transcript…"
          className="w-full rounded-xl border border-white/8 bg-white/5 py-2 pl-9 pr-8 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {matchCount !== null && (
        <p className="mb-3 text-xs text-slate-500">
          {matchCount === 0 ? 'No matches' : `${matchCount} segment${matchCount !== 1 ? 's' : ''} matched`}
        </p>
      )}

      {/* Segment list */}
      <div className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-600">No segments found.</p>
        ) : (
          filtered.map((seg) => {
            const isActive = seg.id === activeId;
            const speaker = seg.speaker_name ?? 'Unknown';
            const color = avatarColor(speaker);
            return (
              <div
                key={seg.id}
                ref={isActive ? activeRef : undefined}
                onClick={() => {
                  setActiveId(seg.id);
                  if (seg.start_seconds != null && onSegmentClick) {
                    onSegmentClick(seg.start_seconds);
                  }
                }}
                className={`group flex cursor-pointer gap-3 rounded-xl px-3 py-3 transition-all duration-150 ${
                  isActive
                    ? 'bg-violet-500/15 ring-1 ring-violet-500/30'
                    : 'hover:bg-white/5'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${color}`}
                >
                  {initials(speaker)}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-slate-300">{speaker}</span>
                    {seg.start_seconds != null && (
                      <span className="font-mono text-[10px] text-slate-600">
                        {formatTimestamp(seg.start_seconds)}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors"
                    dangerouslySetInnerHTML={{ __html: highlight(seg.text, query) }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
