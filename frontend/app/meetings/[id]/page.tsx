'use client';

import { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMeeting, updateMeeting, deleteMeeting, generateSummary, regenerateSummary } from '@/lib/api';
import type { Meeting, Participant } from '@/lib/types';
import {
  formatDate,
  formatDuration,
  initials,
  avatarColor,
  toLocalDatetimeString,
} from '@/lib/utils';
import TranscriptPanel from '@/components/TranscriptPanel';
import SummaryPanel from '@/components/SummaryPanel';
import ActionItemsPanel from '@/components/ActionItemsPanel';
import TopicsPanel from '@/components/TopicsPanel';
import MediaPlayerPlaceholder, { type MediaPlayerRef } from '@/components/MediaPlayerPlaceholder';
import ToastContainer, { type ToastMessage } from '@/components/Toast';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  FileText,
  Sparkles,
  CheckSquare,
  BookOpen,
  Loader2,
  Edit,
  Trash2,
  X,
  Plus,
} from 'lucide-react';

type Tab = 'transcript' | 'summary' | 'actions' | 'topics';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'transcript', label: 'Transcript', icon: FileText },
  { id: 'summary',    label: 'Summary',    icon: Sparkles },
  { id: 'actions',    label: 'Action Items', icon: CheckSquare },
  { id: 'topics',     label: 'Topics',     icon: BookOpen },
];

export default function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('transcript');

  // Shared state for topic selection jumping
  const [jumpToTime, setJumpToTime] = useState<number | null>(null);

  // Player state and references for audio sync
  const playerRef = useRef<MediaPlayerRef>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    playerRef.current?.seekTo(seconds);
  };

  // AI Summary generation state
  const [generating, setGenerating] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDurationMinutes, setEditDurationMinutes] = useState(0);
  const [editParticipants, setEditParticipants] = useState<Omit<Participant, 'id'>[]>([]);

  // Participant Form Inside Modal
  const [newPartName, setNewPartName] = useState('');
  const [newPartEmail, setNewPartEmail] = useState('');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const fetchMeetingDetails = () => {
    setLoading(true);
    getMeeting(Number(id))
      .then((data) => {
        setMeeting(data);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMeetingDetails();
  }, [id]);

  function addToast(message: string, type: 'success' | 'error') {
    const toastId = Math.random().toString();
    setToasts((prev) => [...prev, { id: toastId, message, type }]);
  }

  function dismissToast(toastId: string) {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }

  const handleSelectTopic = (startSeconds: number) => {
    handleSeek(startSeconds);
    setJumpToTime(startSeconds);
    setActiveTab('transcript');
    addToast(`Jumped to topic starting at ${Math.floor(startSeconds / 60)}m ${Math.floor(startSeconds % 60)}s`, 'success');
  };

  // Open Edit Modal & Populate Form
  const openEditModal = () => {
    if (!meeting) return;
    setEditTitle(meeting.title || '');
    setEditDescription(meeting.description || '');
    setEditDate(toLocalDatetimeString(meeting.meeting_date));
    setEditDurationMinutes(meeting.duration_seconds ? Math.floor(meeting.duration_seconds / 60) : 0);
    setEditParticipants(meeting.participants.map(p => ({ name: p.name, email: p.email })));
    setShowEditModal(true);
  };

  // Add participant to editing list
  const handleAddParticipant = () => {
    if (!newPartName.trim() || !newPartEmail.trim()) return;
    if (editParticipants.some(p => p.email.toLowerCase() === newPartEmail.trim().toLowerCase())) {
      addToast('Participant with this email is already added.', 'error');
      return;
    }
    setEditParticipants(prev => [...prev, { name: newPartName.trim(), email: newPartEmail.trim().toLowerCase() }]);
    setNewPartName('');
    setNewPartEmail('');
  };

  // Remove participant from editing list
  const handleRemoveParticipant = (email: string) => {
    setEditParticipants(prev => prev.filter(p => p.email !== email));
  };

  // Submit edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting) return;
    setEditLoading(true);

    try {
      const updated = await updateMeeting(meeting.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        meeting_date: editDate ? new Date(editDate).toISOString() : null,
        duration_seconds: editDurationMinutes * 60,
        participants: editParticipants,
      });
      setMeeting(updated);
      setShowEditModal(false);
      addToast('Meeting updated successfully.', 'success');
      // Refetch just to ensure total synchronization
      fetchMeetingDetails();
    } catch (err) {
      addToast('Failed to update meeting.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Meeting
  const handleDeleteMeeting = async () => {
    if (!meeting) return;
    if (!confirm('Are you sure you want to permanently delete this meeting? All transcript segments, action items, and summaries will be lost.')) {
      return;
    }

    try {
      await deleteMeeting(meeting.id);
      addToast('Meeting deleted successfully. Redirecting…', 'success');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      addToast('Failed to delete meeting.', 'error');
    }
  };

  // Generate AI Summary
  const handleGenerateAIAnalysis = async () => {
    if (!meeting) return;
    setGenerating(true);
    try {
      const updated = await generateSummary(meeting.id);
      setMeeting(updated);
      addToast('AI summary generated successfully.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to generate AI summary.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Regenerate AI Summary
  const handleRegenerateAIAnalysis = async () => {
    if (!meeting) return;
    setGenerating(true);
    try {
      const updated = await regenerateSummary(meeting.id);
      setMeeting(updated);
      addToast('AI summary regenerated successfully.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to regenerate AI summary.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
        <span className="text-sm text-slate-500">Loading meeting…</span>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8">
        <p className="text-base font-medium text-rose-400">
          {error ?? 'Meeting not found'}
        </p>
        <Link
          href="/meetings"
          className="text-sm text-violet-400 underline hover:text-violet-300"
        >
          Back to meetings
        </Link>
      </div>
    );
  }

  const tabContent: Record<Tab, React.ReactNode> = {
    transcript: (
      <TranscriptPanel
        key={meeting.updated_at}
        segments={meeting.transcript_segments}
        jumpToTime={jumpToTime}
        currentTime={currentTime}
        onSegmentClick={handleSeek}
      />
    ),
    summary:    <SummaryPanel key={meeting.updated_at} summary={meeting.summary} onGenerate={handleGenerateAIAnalysis} generating={generating} />,
    actions:    <ActionItemsPanel key={meeting.updated_at} meetingId={meeting.id} items={meeting.action_items} />,
    topics:     <TopicsPanel key={meeting.updated_at} topics={meeting.topics} onSelectTopic={handleSelectTopic} />,
  };

  return (
    <div className="min-h-screen px-8 py-8 relative">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Back */}
      <Link
        href="/meetings"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-violet-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Meetings
      </Link>

      {/* Title + controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{meeting.title}</h1>
          {meeting.description && (
            <p className="mt-1.5 text-sm text-slate-500">{meeting.description}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
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
                {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {meeting.summary ? (
            <button
              onClick={handleRegenerateAIAnalysis}
              disabled={generating}
              className="flex items-center gap-1.5 rounded-xl border border-violet-500/20 bg-violet-600/5 px-4 py-2 text-xs font-semibold text-violet-300 hover:border-violet-500/40 hover:bg-violet-600/10 transition active:scale-95 disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Regenerate Summary
            </button>
          ) : (
            <button
              onClick={handleGenerateAIAnalysis}
              disabled={generating}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition active:scale-95 disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Generate AI Summary
            </button>
          )}
          <button
            onClick={openEditModal}
            className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-[#13151d] px-4 py-2 text-xs font-semibold text-slate-400 hover:border-violet-500/40 hover:text-violet-300 transition"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={handleDeleteMeeting}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2 text-xs font-semibold text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Participants row */}
      {meeting.participants.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {meeting.participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 rounded-full border border-white/6 bg-white/5 px-3 py-1.5"
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${avatarColor(p.name)}`}
              >
                {initials(p.name)}
              </div>
              <span className="text-xs text-slate-300">{p.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Media player */}
      <div className="mb-6">
        <MediaPlayerPlaceholder
          ref={playerRef}
          title={meeting.title}
          durationSeconds={meeting.duration_seconds}
          onTimeUpdate={setCurrentTime}
        />
      </div>

      {/* Tabs + panels */}
      <div className="rounded-2xl border border-white/5 bg-[#13151d] overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-white/5">
          {TABS.map(({ id: tabId, label, icon: Icon }) => {
            const active = activeTab === tabId;
            // Badge counts
            const badge =
              tabId === 'actions'
                ? meeting.action_items.length
                : tabId === 'topics'
                ? meeting.topics.length
                : tabId === 'transcript'
                ? meeting.transcript_segments.length
                : null;

            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all border-b-2 ${
                  active
                    ? 'border-violet-500 text-violet-300 bg-violet-500/5'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/3'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {badge != null && badge > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      active
                        ? 'bg-violet-500/30 text-violet-300'
                        : 'bg-white/8 text-slate-500'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Panel content */}
        <div className="h-[calc(100vh-460px)] min-h-96 overflow-y-auto p-6">
          {tabContent[activeTab]}
        </div>
      </div>

      {/* Edit Modal Overlay */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/8 bg-[#13151d] p-6 shadow-2xl animate-slide-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <h2 className="text-lg font-bold text-white">Edit Meeting</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-500 hover:text-slate-300 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Title *
                </label>
                <input
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Meeting Title"
                  className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Meeting Description"
                  rows={3}
                  className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500/50 [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editDurationMinutes}
                    onChange={(e) => setEditDurationMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>

              {/* Participants list */}
              <div className="border-t border-white/5 pt-4">
                <span className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Participants ({editParticipants.length})
                </span>

                <div className="flex flex-wrap gap-2 mb-3">
                  {editParticipants.map((p) => (
                    <div
                      key={p.email}
                      className="flex items-center gap-1.5 rounded-full border border-white/6 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                    >
                      <span>{p.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(p.email)}
                        className="text-slate-500 hover:text-slate-300 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {editParticipants.length === 0 && (
                    <span className="text-xs text-slate-600">No participants added yet.</span>
                  )}
                </div>

                {/* Add participant row */}
                <div className="flex gap-2">
                  <input
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    placeholder="Participant name"
                    className="flex-1 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none"
                  />
                  <input
                    type="email"
                    value={newPartEmail}
                    onChange={(e) => setNewPartEmail(e.target.value)}
                    placeholder="email@company.com"
                    className="flex-1 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddParticipant}
                    className="flex items-center justify-center rounded-lg bg-violet-600/20 px-3 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-white/8 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition disabled:opacity-50"
                >
                  {editLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
