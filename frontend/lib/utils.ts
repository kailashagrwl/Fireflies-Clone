/** Format seconds into mm:ss or h:mm:ss */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

/** Format seconds to a MM:SS timestamp label for the transcript. */
export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Format an ISO datetime string for display. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Return initials from a full name (up to 2 chars). */
export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** Deterministic avatar background colour derived from a string. */
export function avatarColor(name: string): string {
  const palette = [
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
  return palette[Math.abs(hash) % palette.length];
}

/** Highlight occurrences of `query` in `text` with a <mark> wrapper. */
export function highlight(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(escaped, 'gi'),
    (m) => `<mark class="bg-yellow-400/30 text-yellow-200 rounded px-0.5">${m}</mark>`
  );
}

/** Convert ISO datetime string to YYYY-MM-DDTHH:MM for datetime-local input */
export function toLocalDatetimeString(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  const Y = date.getFullYear();
  const M = (date.getMonth() + 1).toString().padStart(2, '0');
  const D = date.getDate().toString().padStart(2, '0');
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${Y}-${M}-${D}T${h}:${m}`;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  meetingId?: number | string;
  read: boolean;
  createdAt: string;
}

export function addNotification(title: string, message: string, meetingId?: number | string) {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('firefiles-notifications');
    const list: AppNotification[] = saved ? JSON.parse(saved) : [];
    
    const newNotif: AppNotification = {
      id: Math.random().toString(),
      title,
      message,
      meetingId,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('firefiles-notifications', JSON.stringify([newNotif, ...list]));
    window.dispatchEvent(new Event('firefiles-notifications-updated'));
  } catch (err) {
    console.error('Failed to create notification', err);
  }
}

