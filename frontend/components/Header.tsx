'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Mic, Bell, ChevronDown, Sparkles, Menu, ShieldCheck } from 'lucide-react';
import { type AppNotification } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // Resolve page title based on path
  let title = 'Home';
  if (pathname === '/meetings') {
    title = 'Meetings';
  } else if (pathname.startsWith('/meetings/')) {
    title = 'Meeting Details';
  } else if (pathname === '/settings') {
    title = 'Settings';
  } else if (pathname === '/uploads') {
    title = 'Uploads';
  }

  // Profile dropdown states
  const [profileOpen, setProfileOpen] = useState(false);

  // Notification dropdown states
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Coming Soon modal states
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState('');
  const [comingSoonDesc, setComingSoonDesc] = useState('');

  // Load and refresh notifications from localStorage
  const refreshNotifications = () => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('firefiles-notifications');
      setNotifications(saved ? JSON.parse(saved) : []);
    } catch (e) {
      console.error('Failed to load notifications from localStorage', e);
    }
  };

  useEffect(() => {
    refreshNotifications();
    window.addEventListener('firefiles-notifications-updated', refreshNotifications);
    return () => {
      window.removeEventListener('firefiles-notifications-updated', refreshNotifications);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('firefiles-notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('firefiles-notifications-updated'));
  };

  const handleNotifClick = (n: AppNotification) => {
    // Mark this notification as read
    const updated = notifications.map(item => item.id === n.id ? { ...item, read: true } : item);
    setNotifications(updated);
    localStorage.setItem('firefiles-notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('firefiles-notifications-updated'));
    setNotifOpen(false);

    // Route to meeting detail if id is attached
    if (n.meetingId) {
      router.push(`/meetings/${n.meetingId}`);
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
    localStorage.setItem('firefiles-notifications', JSON.stringify([]));
    window.dispatchEvent(new Event('firefiles-notifications-updated'));
  };

  const toggleMobileSidebar = () => {
    document.body.classList.toggle('mobile-sidebar-open');
  };

  const handleComingSoon = (featureTitle: string, description: string) => {
    setProfileOpen(false);
    setNotifOpen(false);
    setComingSoonTitle(featureTitle);
    setComingSoonDesc(description);
    setComingSoonOpen(true);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-xs relative">
      {/* Title & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 md:hidden active:scale-95 transition-all cursor-pointer"
          title="Toggle navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">{title}</h1>
      </div>

      {/* Search Input */}
      <div className="relative mx-4 hidden max-w-md flex-1 sm:block">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Search by title or keyword"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-10 pr-12 text-sm text-slate-800 placeholder-slate-400 outline-hidden transition-all focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
        />
        <div className="absolute inset-y-0 right-3 flex items-center">
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 relative">
        {/* Upgrade Button */}
        <button
          onClick={() => handleComingSoon("Pricing Plans", "Pro and Enterprise plan upgrades are coming soon.")}
          className="hidden rounded-lg border border-violet-200 bg-violet-50/50 px-3.5 py-1.5 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-50 md:block cursor-pointer"
        >
          Upgrade
        </button>

        {/* Capture Button Dropdown */}
        <button
          onClick={() => handleComingSoon("Live Meeting Capture", "Real-time call transcription and chrome web tab capture are coming soon.")}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Capture
          <ChevronDown className="h-3 w-3" />
        </button>

        <div className="h-4 w-px bg-slate-200" />

        {/* Quick icons */}
        <div className="flex items-center gap-2 text-slate-500 relative">
          <button
            onClick={() => handleComingSoon("Voice Capture", "Direct microphone recording is coming soon.")}
            className="rounded-lg p-1.5 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <Mic className="h-4 w-4" />
          </button>
          
          {/* Notification bell button */}
          <button
            onClick={() => {
              setProfileOpen(false);
              setNotifOpen(!notifOpen);
            }}
            className="relative rounded-lg p-1.5 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Panel Dropdown */}
          {notifOpen && (
            <>
              {/* Click-outside backdrop overlay */}
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setNotifOpen(false)}
              />

              <div className="absolute right-0 top-10 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 text-slate-800 flex flex-col gap-3.5 text-left animate-slide-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-violet-600 hover:text-violet-750 transition cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 gap-1">
                      <Bell className="h-6 w-6 text-slate-350" />
                      <p className="text-[11px] font-semibold text-slate-400 mt-1">You have no notifications!</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className="w-full rounded-xl p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition text-left flex items-start gap-2.5 relative cursor-pointer"
                      >
                        <div className="mt-1 shrink-0">
                          {n.read ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 block animate-none" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-600 block animate-pulse" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${n.read ? 'text-slate-500 font-medium' : 'text-slate-800 font-bold'} truncate`}>
                            {n.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed break-words">
                            {n.message}
                          </p>
                          <span className="text-[8px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] font-semibold text-slate-400 hover:text-rose-500 transition cursor-pointer text-center w-full block border-t border-slate-100 pt-2"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Avatar trigger button */}
        <button
          onClick={() => {
            setNotifOpen(false);
            setProfileOpen(!profileOpen);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 ring-2 ring-violet-50 hover:opacity-90 cursor-pointer"
        >
          K
        </button>

        {/* Profile Panel Dropdown */}
        {profileOpen && (
          <>
            {/* Click-outside backdrop overlay */}
            <div
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setProfileOpen(false)}
            />

            <div className="absolute right-0 top-10 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 text-slate-800 flex flex-col gap-3.5 text-left animate-slide-in">
              {/* User profile header */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                  K
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 truncate">Kailash Agarwal</h4>
                  <p className="text-[10px] text-slate-400 truncate">kailash@company.com</p>
                  <span className="inline-block mt-1 rounded-md bg-violet-50 border border-violet-100 text-violet-600 px-1.5 py-0.5 text-[9px] font-bold">
                    Free Plan
                  </span>
                </div>
              </div>

              {/* Storage details */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>Usage Storage</span>
                  <span>0% (0 / 800 mins)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                  <div className="w-0 h-full bg-violet-600 rounded-full" />
                </div>
              </div>

              {/* Menu options list */}
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-0.5">
                <button
                  onClick={() => handleComingSoon("Refer & Earn", "Refer colleagues and earn free recording credits.")}
                  className="w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 text-left transition cursor-pointer"
                >
                  <span>Refer &amp; Earn</span>
                  <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">Invite</span>
                </button>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    router.push('/settings');
                  }}
                  className="w-full rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 text-left transition cursor-pointer"
                >
                  Settings
                </button>

                <button
                  onClick={() => handleComingSoon("Manage Devices", "View and disconnect active login sessions on other devices.")}
                  className="w-full rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 text-left transition cursor-pointer"
                >
                  Manage Devices
                </button>

                <button
                  onClick={() => handleComingSoon("Platform Rules", "Review workspace guidelines and meeting recording compliance terms.")}
                  className="w-full rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 text-left transition cursor-pointer"
                >
                  Platform Rules
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  onClick={() => handleComingSoon("Logout", "Logout is not available in this demo workspace environment.")}
                  className="w-full rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 text-left transition cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Shared "Coming Soon" Modal for header placeholders */}
      {comingSoonOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setComingSoonOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-slide-in text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-violet-600 mb-3">
              <div className="p-2 bg-violet-50 rounded-xl">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">{comingSoonTitle}</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              {comingSoonDesc}
            </p>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setComingSoonOpen(false)}
                className="rounded-xl bg-violet-600 hover:bg-violet-750 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all"
              >
                Okay, I understand
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
