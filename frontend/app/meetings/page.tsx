'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMeetings, createMeeting } from '@/lib/api';
import type { MeetingListItem, MeetingFilters, SortOrder, Participant } from '@/lib/types';
import MeetingCard from '@/components/MeetingCard';
import { addNotification } from '@/lib/utils';
import ToastContainer, { type ToastMessage } from '@/components/Toast';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Mic2,
  X,
  ArrowUpDown,
  Calendar,
  Users,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/20">
        <Mic2 className="h-7 w-7 text-violet-400" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-300">
          {filtered ? 'No meetings match your filters' : 'No meetings yet'}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {filtered
            ? 'Try adjusting your search or filters.'
            : 'Record your first meeting to get started.'}
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
      <p className="text-sm font-medium text-rose-400">Failed to load meetings</p>
      <p className="mt-1 text-xs text-slate-600">{message}</p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [titleQuery, setTitleQuery] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sort, setSort] = useState<SortOrder>('recent');
  const [showFilters, setShowFilters] = useState(false);

  // Create Meeting Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDurationMinutes, setNewDurationMinutes] = useState(30);
  const [newParticipants, setNewParticipants] = useState<Omit<Participant, 'id'>[]>([]);
  const [newTranscript, setNewTranscript] = useState('');
  const [fileSegments, setFileSegments] = useState<any[] | null>(null);

  // Create Modal Participant Form
  const [partName, setPartName] = useState('');
  const [partEmail, setPartEmail] = useState('');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function addToast(message: string, type: 'success' | 'error') {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const filters: MeetingFilters = {
      sort,
      ...(titleQuery && { title: titleQuery }),
      ...(participantEmail && { participant_email: participantEmail }),
      ...(dateFilter && { date: dateFilter }),
    };
    try {
      const data = await getMeetings(filters);
      setMeetings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [titleQuery, participantEmail, dateFilter, sort]);

  // Debounce title search
  useEffect(() => {
    const t = setTimeout(fetchMeetings, 300);
    return () => clearTimeout(t);
  }, [fetchMeetings]);

  const hasActiveFilters = participantEmail || dateFilter;
  const isFiltered = !!(titleQuery || participantEmail || dateFilter);

  function clearFilters() {
    setTitleQuery('');
    setParticipantEmail('');
    setDateFilter('');
    setSort('recent');
    addToast('Filters reset successfully.', 'success');
  }

  const handleAddParticipant = () => {
    if (!partName.trim() || !partEmail.trim()) return;
    if (newParticipants.some(p => p.email.toLowerCase() === partEmail.trim().toLowerCase())) {
      addToast('Participant with this email already added.', 'error');
      return;
    }
    setNewParticipants(prev => [...prev, { name: partName.trim(), email: partEmail.trim().toLowerCase() }]);
    setPartName('');
    setPartEmail('');
  };

  const handleRemoveParticipant = (email: string) => {
    setNewParticipants(prev => prev.filter(p => p.email !== email));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const fileName = file.name.toLowerCase();
      let parsed: any[] = [];

      try {
        if (fileName.endsWith('.json')) {
          const json = JSON.parse(content);
          if (Array.isArray(json)) {
            parsed = json.map((item: any, idx: number) => ({
              speaker_name: item.speaker_name || item.speaker || item.speakerName || 'Speaker',
              text: item.text || item.content || item.message || '',
              start_seconds: Number(item.start_seconds ?? item.start ?? (idx * 10)),
              end_seconds: Number(item.end_seconds ?? item.end ?? ((idx + 1) * 10)),
              sequence: idx + 1
            }));
          } else if (json.segments && Array.isArray(json.segments)) {
            parsed = json.segments.map((item: any, idx: number) => ({
              speaker_name: item.speaker_name || item.speaker || item.speakerName || 'Speaker',
              text: item.text || item.content || item.message || '',
              start_seconds: Number(item.start_seconds ?? item.start ?? (idx * 10)),
              end_seconds: Number(item.end_seconds ?? item.end ?? ((idx + 1) * 10)),
              sequence: idx + 1
            }));
          } else {
            throw new Error('JSON format not recognized. Must be an array of segments or contain a segments property.');
          }
        } else if (fileName.endsWith('.vtt')) {
          const lines = content.split('\n');
          let seq = 1;
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('-->')) {
              const times = line.split('-->').map(t => t.trim());
              const parseVttTime = (tStr: string) => {
                const parts = tStr.split(':');
                let secs = 0;
                if (parts.length === 3) {
                  secs = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
                } else if (parts.length === 2) {
                  secs = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
                }
                return isNaN(secs) ? 0 : secs;
              };
              const start = parseVttTime(times[0]);
              const end = parseVttTime(times[1]);
              
              let textLine = '';
              while (i + 1 < lines.length && !lines[i + 1].trim()) {
                i++;
              }
              if (i + 1 < lines.length) {
                textLine = lines[i + 1].trim();
                i++;
              }

              const colonIdx = textLine.indexOf(':');
              let speaker = 'Speaker';
              let text = textLine;
              if (colonIdx > 0 && colonIdx < 30) {
                speaker = textLine.substring(0, colonIdx).trim();
                text = textLine.substring(colonIdx + 1).trim();
              }
              parsed.push({
                speaker_name: speaker,
                start_seconds: start,
                end_seconds: end,
                text: text,
                sequence: seq++
              });
            }
          }
        } else {
          const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
          parsed = lines.map((line, idx) => {
            const colonIdx = line.indexOf(':');
            let speakerName = 'Speaker';
            let text = line;
            if (colonIdx > 0 && colonIdx < 30) {
              speakerName = line.substring(0, colonIdx).trim();
              text = line.substring(colonIdx + 1).trim();
            }
            return {
              speaker_name: speakerName,
              start_seconds: idx * 10,
              end_seconds: (idx + 1) * 10,
              text: text,
              sequence: idx + 1,
            };
          });
        }

        if (parsed.length === 0) {
          addToast('No segments found in the uploaded file.', 'error');
          return;
        }

        setFileSegments(parsed);
        const preview = parsed.map(s => `${s.speaker_name}: ${s.text}`).join('\n');
        setNewTranscript(preview);
        addToast(`Successfully parsed ${parsed.length} segments from ${file.name}.`, 'success');
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Failed to parse transcript file.', 'error');
      }
    };

    reader.onerror = () => {
      addToast('Failed to read file.', 'error');
    };

    reader.readAsText(file);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreateLoading(true);

    try {
      // Create a default transcript segment and summary overview if not provided,
      // to make the newly created meetings feel populated and realistic.
      const payload = {
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        meeting_date: newDate ? new Date(newDate).toISOString() : new Date().toISOString(),
        duration_seconds: newDurationMinutes * 60,
        participants: newParticipants,
        transcript_segments: fileSegments && fileSegments.length > 0
          ? fileSegments
          : newTranscript.trim()
            ? newTranscript.split('\n').map(l => l.trim()).filter(Boolean).map((line, idx) => {
                const colonIdx = line.indexOf(':');
                let speakerName = newParticipants[0]?.name || 'Organizer';
                let text = line;
                if (colonIdx > 0 && colonIdx < 30) {
                  speakerName = line.substring(0, colonIdx).trim();
                  text = line.substring(colonIdx + 1).trim();
                }
                return {
                  speaker_name: speakerName,
                  start_seconds: idx * 10,
                  end_seconds: (idx + 1) * 10,
                  text: text,
                  sequence: idx + 1,
                };
              })
            : [
                {
                  speaker_name: newParticipants[0]?.name || 'Organizer',
                  speaker_id: 1,
                  start_seconds: 0.0,
                  end_seconds: 15.0,
                  text: `Welcome everyone to our meeting: "${newTitle.trim()}". Let's get started.`,
                  sequence: 1,
                }
              ],
        summary: {
          overview: newDescription.trim() || `Summary overview for ${newTitle.trim()}.`,
          key_points: `- Meeting initialized.\n- Participants synchronized.\n- Initial briefing completed.`,
        },
        action_items: [
          {
            title: 'Distribute meeting notes and follow up on next steps.',
            description: 'Send summary email to all participants.',
            assignee: newParticipants[0]?.email || null,
            due_date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
            completed: false,
          }
        ],
        topics: [
          {
            title: 'Introduction and Goals alignment',
            start_seconds: 0.0,
            end_seconds: 60.0,
          }
        ]
      };

      const created = await createMeeting(payload);
      addToast('Meeting created successfully.', 'success');
      addNotification('New meeting created', `"${created.title}" is now available.`, created.id);
      setShowCreateModal(false);
      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewDate('');
      setNewDurationMinutes(30);
      setNewParticipants([]);
      setNewTranscript('');
      setFileSegments(null);
      // Reload meetings
      fetchMeetings();
    } catch (err) {
      addToast('Failed to create meeting.', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // Auto-trigger new meeting modal if query param is set
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'new') {
        setShowCreateModal(true);
        // Clean URL parameter
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  return (
    <div className="relative font-sans text-slate-700 space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            {loading ? '...' : `${meetings.length} total meeting${meetings.length !== 1 ? 's' : ''}`}
            {isFiltered && !loading && ' (filtered)'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-700 active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Meeting
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="space-y-3">
        <div className="flex gap-3">
          {/* Title search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={titleQuery}
              onChange={(e) => setTitleQuery(e.target.value)}
              placeholder="Search meetings by title..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-hidden focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
            />
            {titleQuery && (
              <button
                onClick={() => setTitleQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => setSort((s) => (s === 'recent' ? 'oldest' : 'recent'))}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 cursor-pointer"
            title={sort === 'recent' ? 'Currently: Newest first' : 'Currently: Oldest first'}
          >
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
            {sort === 'recent' ? 'Recent' : 'Oldest'}
          </button>

          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
              showFilters || hasActiveFilters
                ? 'border-violet-300 bg-violet-50 text-violet-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">
                !
              </span>
            )}
          </button>
        </div>

        {/* Advanced filter panel */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-slide-in">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <input
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                placeholder="Filter by email..."
                className="w-52 bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-hidden"
              />
              {participantEmail && (
                <button onClick={() => setParticipantEmail('')}>
                  <X className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-850 outline-hidden [color-scheme:light]"
              />
              {dateFilter && (
                <button onClick={() => setDateFilter('')}>
                  <X className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs font-semibold text-slate-400 hover:text-rose-500 transition cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-24">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
          <span className="text-sm text-slate-450 font-medium">Loading meetings…</span>
        </div>
      ) : error ? (
        <ErrorState message={error} />
      ) : meetings.length === 0 ? (
        <EmptyState filtered={isFiltered} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {meetings.map((m) => (
            <MeetingCard key={m.id} meeting={m} />
          ))}
        </div>
      )}

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-slide-in max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-800">Create New Meeting</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Title *
                </label>
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Product Strategy Review"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 outline-hidden focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What is this meeting about?"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 outline-hidden focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Transcript content (Format: "Speaker: Text" per line)
                </label>
                <textarea
                  value={newTranscript}
                  onChange={(e) => {
                    setNewTranscript(e.target.value);
                    setFileSegments(null);
                  }}
                  placeholder="e.g.&#10;Alice: Welcome everyone.&#10;Bob: Let's discuss the roadmap."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 outline-hidden focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all resize-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Or upload transcript file (.txt, .vtt, .json)
                </label>
                <input
                  type="file"
                  accept=".txt,.vtt,.json"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-600 hover:file:bg-violet-100 file:cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 outline-hidden focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all [color-scheme:light]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newDurationMinutes}
                    onChange={(e) => setNewDurationMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 outline-hidden focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>
              </div>

              {/* Participants Section */}
              <div className="border-t border-slate-100 pt-4">
                <span className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Participants ({newParticipants.length})
                </span>

                <div className="flex flex-wrap gap-2 mb-3">
                  {newParticipants.map((p) => (
                    <div
                      key={p.email}
                      className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                    >
                      <span>{p.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(p.email)}
                        className="text-slate-400 hover:text-rose-500 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {newParticipants.length === 0 && (
                    <span className="text-xs text-slate-400">No participants added yet.</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    placeholder="Participant name"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-850 outline-hidden focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                  <input
                    type="email"
                    value={partEmail}
                    onChange={(e) => setPartEmail(e.target.value)}
                    placeholder="email@company.com"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-850 outline-hidden focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddParticipant}
                    className="flex items-center justify-center rounded-xl bg-violet-50 px-4 text-xs font-semibold text-violet-600 hover:bg-violet-100 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-250 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-750 transition disabled:opacity-50"
                >
                  {createLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
