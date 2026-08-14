'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  X,
  Inbox,
  Calendar,
  Users,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { createMeeting } from '@/lib/api';
import type { Participant } from '@/lib/types';
import ToastContainer, { type ToastMessage } from '@/components/Toast';
import { addNotification } from '@/lib/utils';

export default function UploadsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [showBanner, setShowBanner] = useState(true);
  const [isDragActive, setIsDragActive] = useState(false);

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

  // Modal Participant Form
  const [partName, setPartName] = useState('');
  const [partEmail, setPartEmail] = useState('');

  // Audio coming soon state
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFileName, setComingSoonFileName] = useState('');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function addToast(message: string, type: 'success' | 'error') {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ---------------------------------------------------------------------------
  // Dropzone drag/drop handlers
  // ---------------------------------------------------------------------------
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // ---------------------------------------------------------------------------
  // File processing and parsing
  // ---------------------------------------------------------------------------
  const processSelectedFile = (file: File) => {
    const name = file.name.toLowerCase();
    const ext = name.split('.').pop() || '';

    // Check if it is a media file (unsupported for direct STT, show coming soon alert)
    const mediaExts = ['mp3', 'm4a', 'wav', 'mp4', 'webm'];
    if (mediaExts.includes(ext)) {
      setComingSoonFileName(file.name);
      setShowComingSoon(true);
      return;
    }

    // Supported transcript formats
    const allowedExts = ['txt', 'vtt', 'json'];
    if (!allowedExts.includes(ext)) {
      addToast(`Unsupported file type: .${ext}. Please upload a .txt, .vtt, or .json file.`, 'error');
      return;
    }

    // Read and parse supported files
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        addToast('The selected file is empty.', 'error');
        return;
      }

      try {
        let parsed: any[] = [];
        if (ext === 'json') {
          // Parse JSON transcript
          const data = JSON.parse(content);
          const rawSegments = Array.isArray(data) ? data : data.segments || [];
          parsed = rawSegments.map((s: any, idx: number) => ({
            speaker_name: s.speaker || s.speaker_name || 'Speaker',
            start_seconds: parseFloat(s.start ?? s.start_seconds ?? idx * 10),
            end_seconds: parseFloat(s.end ?? s.end_seconds ?? (idx + 1) * 10),
            text: s.text || s.content || '',
            sequence: idx + 1,
          }));
        } else if (ext === 'vtt') {
          // Parse WebVTT transcript
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
          // Parse text files using turn-based newline parsing
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
          addToast('No dialogue segments found in the file.', 'error');
          return;
        }

        // Set state for creation modal
        setFileSegments(parsed);
        const previewText = parsed.map(s => `${s.speaker_name}: ${s.text}`).join('\n');
        setNewTranscript(previewText);

        // Pre-fill fields with file name
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setNewTitle(cleanName);
        setNewDescription(`Imported from transcript file: ${file.name}`);

        addToast(`Successfully parsed ${parsed.length} segments from ${file.name}.`, 'success');
        setShowCreateModal(true);
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Failed to parse file.', 'error');
      }
    };

    reader.onerror = () => {
      addToast('Failed to read transcript file.', 'error');
    };

    reader.readAsText(file);
  };

  // ---------------------------------------------------------------------------
  // Create Meeting logic (Form handler)
  // ---------------------------------------------------------------------------
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreateLoading(true);

    try {
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
            : [{ speaker_name: 'Organizer', start_seconds: 0.0, end_seconds: 10.0, text: 'No dialogue.', sequence: 1 }],
        action_items: [
          {
            title: 'Review meeting transcript and details',
            description: 'Verify summary highlights and correct any transcript spelling inaccuracies.',
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
      addNotification("Transcript is ready", `"${created.title}" transcript has been uploaded and parsed.`, created.id);
      addToast('Meeting created successfully.', 'success');
      setShowCreateModal(false);

      // Reset Create modal form
      setNewTitle('');
      setNewDescription('');
      setNewDate('');
      setNewDurationMinutes(30);
      setNewParticipants([]);
      setNewTranscript('');
      setFileSegments(null);

      // Transition to the newly created meeting details page
      router.push(`/meetings/${created.id}`);
    } catch (err) {
      addToast('Failed to create meeting from uploads.', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-in pb-16 relative">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* 1. Notification Banner */}
      {showBanner && (
        <div className="flex items-center justify-between rounded-xl bg-violet-50/70 border border-violet-100/80 px-4 py-3 text-xs text-violet-750 shadow-3xs">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
            <p className="font-medium">
              Uploads are moving — you’ll find them on the Meetings page soon.
            </p>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="rounded-lg p-1 text-violet-400 hover:bg-violet-100/50 hover:text-violet-600 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 2. Upload Area / Dropzone */}
      <section
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all cursor-pointer bg-white ${
          isDragActive
            ? 'border-violet-500 bg-violet-50/10'
            : 'border-slate-200 hover:border-violet-300 hover:shadow-xs'
        }`}
        onClick={triggerFileInput}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelectChange}
          accept=".txt,.vtt,.json,.mp3,.m4a,.wav,.mp4,.webm"
          className="hidden"
        />

        {/* Upload icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shadow-3xs mb-4">
          <UploadCloud className="h-6 w-6" />
        </div>

        {/* Header */}
        <h3 className="text-base font-bold text-slate-800">
          Upload a file to generate a transcript
        </h3>

        {/* Specs */}
        <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
          Browse or drag and drop MP3, M4A, WAV, MP4 or WEBM files.
          <span className="block mt-0.5 text-[10px]">
            (Max video size: 100 MB, Max audio size: 500 MB)
          </span>
        </p>

        {/* Browse Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // prevent double trigger via dropzone onClick
            triggerFileInput();
          }}
          className="mt-5 rounded-xl bg-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-violet-750 transition-colors cursor-pointer"
        >
          Browse Files
        </button>
      </section>

      {/* 3. Empty State Area */}
      <section className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-white border border-slate-100 shadow-3xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-3 border border-slate-100">
          <Inbox className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-semibold text-slate-600">
          You have no recent uploads!
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
          Transcript uploads and parsed audio recordings will be archived here.
        </p>
      </section>

      {/* 4. Coming Soon Alert modal */}
      {showComingSoon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-slide-in text-slate-800">
            <div className="flex items-center gap-3 text-violet-600 mb-3">
              <div className="p-2 bg-violet-50 rounded-xl">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Audio Transcription Coming Soon</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              We detected <strong className="text-slate-700">{comingSoonFileName}</strong>.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Speech-to-text processing for raw audio/video files is currently in development. In the meantime, you can upload pre-generated transcript files in <strong className="text-slate-700">.txt, .vtt, or .json</strong> formats to test our LLM analysis features!
            </p>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowComingSoon(false)}
                className="rounded-xl bg-violet-600 hover:bg-violet-750 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all"
              >
                Okay, I understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Create Meeting Modal (Pre-populated from file upload) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-slide-in max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-violet-600" />
                <h2 className="text-lg font-bold text-slate-800">Create Meeting from Upload</h2>
              </div>
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 outline-hidden focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 outline-hidden focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Parsed transcript content (Format: "Speaker: Text" per line)
                </label>
                <textarea
                  value={newTranscript}
                  onChange={(e) => {
                    setNewTranscript(e.target.value);
                    setFileSegments(null);
                  }}
                  rows={6}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 outline-hidden focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all resize-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Meeting Date
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
                        <X className="h-3.5 w-3.5" />
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
                  Generate Transcript Analysis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
