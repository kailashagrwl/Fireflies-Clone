'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Calendar,
  UploadCloud,
  Mic,
  ArrowRight,
  HelpCircle,
  AppWindow,
  Smartphone,
  ChevronRight,
  TrendingUp,
  Clock,
  Zap,
  Plus,
  BookOpen,
  Users,
  MessageSquare,
  Headset,
  Play,
  X
} from 'lucide-react';
import { getMeetings } from '@/lib/api';
import type { MeetingListItem } from '@/lib/types';
import MeetingCard from '@/components/MeetingCard';
import ToastContainer, { type ToastMessage } from '@/components/Toast';

export default function HomePage() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Close Help popover on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHelpOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recent' | 'upcoming' | 'feed'>('recent');

  useEffect(() => {
    async function loadMeetings() {
      try {
        const data = await getMeetings({ sort: 'recent' });
        setMeetings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load meetings');
      } finally {
        setLoading(false);
      }
    }
    loadMeetings();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-slide-in relative">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {/* 1. Welcome Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-rose-100 bg-linear-to-br from-[#fff7f5] to-[#fffaf0] p-6 lg:p-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/60 px-3 py-1 text-xs font-bold text-orange-600 border border-orange-200/50">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Workspace Active</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-800">
            Welcome Aboard, Kailash!
          </h2>
          <p className="text-sm leading-relaxed text-slate-500 max-w-md">
            Fireflies is now ready to automate your meetings and streamline your workflows. Auto-join meetings, transcribe audio files, and generate AI insights in seconds.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/meetings?action=new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" />
              Configure Auto-Join
            </Link>
            <a
              href="https://github.com/kailashagrwl/Fireflies-Clone"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Read Docs
            </a>
          </div>
        </div>

        {/* Video / Preview Card Mockup */}
        <div className="w-full md:w-80 lg:w-96 shrink-0 aspect-video md:aspect-auto md:h-48 rounded-2xl bg-white border border-slate-100 shadow-md p-4 flex flex-col justify-between overflow-hidden relative group hover:border-violet-200 transition-all duration-300">
          {/* Mockup decoration */}
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="my-auto space-y-2">
            <div className="h-3 w-2/3 rounded-sm bg-slate-100" />
            <div className="h-2.5 w-full rounded-sm bg-slate-50" />
            <div className="h-2.5 w-4/5 rounded-sm bg-slate-50" />
          </div>
          <div className="flex items-center justify-between border-t border-slate-50 pt-2.5 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-violet-500" />
              AI Summary Engine
            </span>
            <span className="text-violet-600 font-bold flex items-center gap-0.5 group-hover:gap-1 transition-all">
              Watch Demo <ChevronRight className="h-3 w-3" />
            </span>
          </div>
          {/* Overlay glow */}
          <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-violet-400/10 rounded-full blur-xl pointer-events-none" />
        </div>
      </section>

      {/* 2. Quick Start Section */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Quick Start</h3>
          <p className="text-xs text-slate-400 mt-0.5">Capture your first meeting or upload a recording to see Fireflies in action.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Schedule Meeting */}
          <Link
            href="/meetings?action=new"
            className="flex items-center justify-between p-5 rounded-2xl bg-[#eff6ff]/70 border border-blue-100 shadow-xs hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-white shadow-xs">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800">Schedule Meeting</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Connect calendar &amp; invite AskFred</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </Link>

          {/* Card 2: Upload File */}
          <Link
            href="/uploads"
            className="flex items-center justify-between p-5 rounded-2xl bg-[#faf5ff]/70 border border-purple-100 shadow-xs hover:shadow-md hover:border-purple-200 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500 text-white shadow-xs">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800">Upload File</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Upload audio/video or transcript</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
          </Link>

          {/* Card 3: Capture Meeting */}
          <button
            onClick={() => addToast("Capture Meeting is coming soon! Real-time mic recording and browser tab capture will be available soon.", "success")}
            className="flex items-center justify-between p-5 rounded-2xl bg-[#fff1f2]/70 border border-rose-100 shadow-xs hover:shadow-md hover:border-rose-200 transition-all group text-left w-full cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500 text-white shadow-xs">
                <Mic className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800">Capture Meeting</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Transcribe active mic or browser tab</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </section>

      {/* 3. Tab Section & Meetings */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          {/* Tabs */}
          <div className="flex gap-2">
            {(['recent', 'upcoming', 'feed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-violet-50 text-violet-600 shadow-3xs'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {tab === 'recent' && 'Recent Meetings'}
                {tab === 'upcoming' && 'Upcoming Meetings'}
                {tab === 'feed' && 'AI Feed'}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Settings
            </Link>
            <div className="h-3 w-px bg-slate-200" />
            <Link
              href="/meetings"
              className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-0.5"
            >
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Tab contents */}
        {activeTab === 'recent' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
                <span className="animate-spin h-4 w-4 rounded-full border-2 border-violet-600 border-t-transparent" />
                <span className="text-sm">Loading recent meetings...</span>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-6 text-center text-sm text-rose-600">
                {error}
              </div>
            ) : meetings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                <p className="text-sm font-semibold text-slate-600">No recent meetings found</p>
                <p className="text-xs text-slate-400 mt-1">Start by creating a meeting using Quick Start actions.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {meetings.slice(0, 3).map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <Calendar className="mx-auto h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600 mt-3">No upcoming scheduled meetings</p>
            <p className="text-xs text-slate-400 mt-1">Connect your Google Calendar in settings to sync events.</p>
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <Clock className="mx-auto h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600 mt-3">AI insights feed is empty</p>
            <p className="text-xs text-slate-400 mt-1">AI feed populates as new transcripts are analyzed.</p>
          </div>
        )}
      </section>

      {/* 4. Lower Apps Promo */}
      <section className="space-y-4 pt-4">
        <h3 className="text-md font-bold text-slate-800">Try More</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Chrome Extension */}
          <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-3xs group hover:border-slate-300 transition-colors">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
              <AppWindow className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-slate-800 truncate">Chrome Extension</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                Capture and transcribe Google Meet, Zoom, and Teams meetings directly from your web browser.
              </p>
            </div>
            <a
              href="https://chromewebstore.google.com/detail/fireflies-ai-meeting-note/meimoidfecamngeoanhnpdjjdcefoldn?pli=1"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition shrink-0 cursor-pointer"
            >
              Install
            </a>
          </div>

          {/* Card 2: Mobile App */}
          <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-3xs group hover:border-slate-300 transition-colors">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-slate-800 truncate">Mobile App</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                Record and transcribe in-person discussions on iOS &amp; Android.
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => addToast("App Store download is coming soon!", "success")}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition"
              >
                App Store
              </button>
              <button
                onClick={() => addToast("Google Play download is coming soon!", "success")}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition"
              >
                Google Play
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Floating Help Button & Popover */}
      {isHelpOpen && (
        <>
          {/* Backdrop Click Out overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsHelpOpen(false)}
          />

          {/* Floating Help Menu Panel */}
          <div className="fixed bottom-20 right-6 z-50 w-72 md:w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl animate-slide-in flex flex-col text-slate-700">
            {/* Header / YouTube Overview */}
            <a
              href="https://www.youtube.com/watch?v=uZuFXgNfZmI&t=1s"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3.5 group hover:bg-slate-50 transition-colors rounded-t-2xl border-b border-slate-100"
            >
              {/* Fake YouTube Thumbnail */}
              <div className="relative aspect-video w-full rounded-xl bg-gradient-to-br from-violet-500 via-indigo-600 to-purple-600 flex items-center justify-center overflow-hidden shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-violet-600 shadow-md transition-transform group-hover:scale-110">
                  <Play className="h-4.5 w-4.5 fill-violet-600 ml-0.5" />
                </div>
                <div className="absolute bottom-2 right-2 text-[9px] font-bold text-white/95 bg-slate-950/70 px-1.5 py-0.5 rounded backdrop-blur-xs font-mono">
                  5:00
                </div>
              </div>
              
              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-850 group-hover:text-violet-600 transition-colors flex items-center gap-1 font-sans">
                  Watch Product Overview (5 min)
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-sans">
                  Settings, AI Skills, and more.
                </p>
              </div>
            </a>

            {/* List options */}
            <div className="p-1.5 space-y-0.5">
              {/* What's new? */}
              <button
                onClick={() => {
                  addToast("What's new updates are coming soon!", "success");
                  setIsHelpOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-xl transition cursor-pointer font-sans"
              >
                <Sparkles className="h-4 w-4 text-slate-400 shrink-0" />
                <span>What's new?</span>
              </button>

              {/* Help Center */}
              <a
                href="https://guide.fireflies.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-xl transition cursor-pointer font-sans"
                onClick={() => setIsHelpOpen(false)}
              >
                <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Help Center</span>
              </a>

              {/* Fireflies Community */}
              <a
                href="https://fireflies.circle.so/feed?utmSource=help&resources_dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-xl transition cursor-pointer font-sans"
                onClick={() => setIsHelpOpen(false)}
              >
                <Users className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Fireflies Community</span>
              </a>

              <hr className="border-slate-100 my-1" />

              {/* Give Feedback */}
              <button
                onClick={() => {
                  addToast("Feedback submission is coming soon!", "success");
                  setIsHelpOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-xl transition cursor-pointer font-sans"
              >
                <MessageSquare className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Give Feedback</span>
              </button>

              {/* Contact Support */}
              <button
                onClick={() => {
                  addToast("Contacting support is coming soon!", "success");
                  setIsHelpOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-xl transition cursor-pointer font-sans"
              >
                <Headset className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Contact Support</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsHelpOpen(!isHelpOpen)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center hover:bg-violet-750 active:scale-95 transition-all z-50 cursor-pointer"
        aria-label="Toggle Help menu"
      >
        {isHelpOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <HelpCircle className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
