'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Check,
  Loader2,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Monitor,
  Lock,
  Database,
  AlertCircle,
} from 'lucide-react';
import { testConnection } from '@/lib/api';

// ──────────────────────────────────────────────
// Toggle Switch Component
// ──────────────────────────────────────────────
function Toggle({
  enabled,
  onChange,
  id,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#13151d] ${
        enabled ? 'bg-violet-600' : 'bg-slate-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ──────────────────────────────────────────────
// Settings Row
// ──────────────────────────────────────────────
function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Section Card Wrapper
// ──────────────────────────────────────────────
function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/6 bg-[#13151d] transition hover:border-violet-500/20">
      <div className="flex items-start gap-4 p-6 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Icon className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
        </div>
      </div>
      <div className="border-t border-white/5 px-6 py-4 divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Disabled Row — clearly labelled placeholder
// ──────────────────────────────────────────────
function DisabledRow({
  label,
  badge,
}: {
  label: string;
  badge: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3 first:pt-0 last:pb-0 opacity-60">
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <span className="rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-500">
        {badge}
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────
// Theme Option Button
// ──────────────────────────────────────────────
type ThemeOption = 'dark' | 'light' | 'system';

const THEME_OPTIONS: { value: ThemeOption; label: string; icon: React.ElementType }[] = [
  { value: 'dark',   label: 'Dark',   icon: Moon },
  { value: 'light',  label: 'Light',  icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
];

function applyTheme(theme: ThemeOption) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('theme-light');
  } else if (theme === 'dark') {
    root.classList.remove('theme-light');
  } else {
    // System
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.remove('theme-light');
    } else {
      root.classList.add('theme-light');
    }
  }
}

// ──────────────────────────────────────────────
// API Connection Status Type
// ──────────────────────────────────────────────
type ConnStatus = 'idle' | 'loading' | 'success' | 'error';

// ──────────────────────────────────────────────
// Main Settings Page
// ──────────────────────────────────────────────
export default function SettingsPage() {
  // ----- Notification Preferences -----
  const [reminders, setReminders] = useState(false);
  const [summaryDelivery, setSummaryDelivery] = useState(true);

  // ----- Appearance -----
  const [theme, setTheme] = useState<ThemeOption>('dark');

  // ----- API Connection Test -----
  const [connStatus, setConnStatus] = useState<ConnStatus>('idle');
  const [connService, setConnService] = useState<string>('');

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://127.0.0.1:8000';

  // Load persisted preferences from localStorage on mount
  useEffect(() => {
    const savedReminders = localStorage.getItem('firefiles-reminders');
    if (savedReminders !== null) setReminders(savedReminders === 'true');

    const savedSummary = localStorage.getItem('firefiles-summaryDelivery');
    if (savedSummary !== null) setSummaryDelivery(savedSummary === 'true');

    const savedTheme = (localStorage.getItem('firefiles-theme') as ThemeOption | null) ?? 'dark';
    setTheme(savedTheme);
    // applyTheme is already handled by ThemeInitializer on load; no need to call here
  }, []);

  // Persist reminders toggle
  const handleReminders = (v: boolean) => {
    setReminders(v);
    localStorage.setItem('firefiles-reminders', String(v));
  };

  // Persist summary delivery toggle
  const handleSummaryDelivery = (v: boolean) => {
    setSummaryDelivery(v);
    localStorage.setItem('firefiles-summaryDelivery', String(v));
  };

  // Switch theme
  const handleTheme = (t: ThemeOption) => {
    setTheme(t);
    localStorage.setItem('firefiles-theme', t);
    applyTheme(t);
  };

  // Test API connection
  const handleTestConnection = useCallback(async () => {
    setConnStatus('loading');
    setConnService('');
    try {
      const result = await testConnection();
      setConnStatus('success');
      setConnService(result.service ?? '');
    } catch {
      setConnStatus('error');
    }
  }, []);

  return (
    <div className="min-h-screen px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your workspace and account preferences.
        </p>
      </div>

      <div className="space-y-4">
        {/* ─── NOTIFICATIONS ─── */}
        <SectionCard
          icon={Bell}
          title="Notifications"
          description="Configure meeting reminders and summary delivery preferences."
        >
          <SettingsRow
            label="Meeting Reminders"
            description="Receive a reminder before scheduled meetings start."
          >
            <Toggle
              id="toggle-reminders"
              enabled={reminders}
              onChange={handleReminders}
            />
          </SettingsRow>
          <SettingsRow
            label="Summary Delivery"
            description="Receive a meeting summary after recordings complete."
          >
            <Toggle
              id="toggle-summary"
              enabled={summaryDelivery}
              onChange={handleSummaryDelivery}
            />
          </SettingsRow>
          <div className="py-3 last:pb-0">
            <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3 shrink-0" />
              Email and push delivery are not yet active. These are preference placeholders.
            </p>
          </div>
        </SectionCard>

        {/* ─── PRIVACY & SECURITY ─── */}
        <SectionCard
          icon={Shield}
          title="Privacy &amp; Security"
          description="Manage data retention, access controls, and SOC2 settings."
        >
          <div className="flex items-center justify-between gap-6 py-3 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-slate-500" />
                Data Retention
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Transcript and summary data retention policy.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium bg-slate-800/60 border border-white/5 px-3 py-1.5 rounded-lg whitespace-nowrap">
              Managed by administrator
            </span>
          </div>
          <DisabledRow
            label="Access Control"
            badge="Coming soon"
          />
          <DisabledRow
            label="SOC2 Settings"
            badge="Coming soon"
          />
          <div className="py-3 last:pb-0">
            <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
              <Lock className="h-3 w-3 shrink-0" />
              Advanced security configuration is managed at the organizational level.
            </p>
          </div>
        </SectionCard>

        {/* ─── APPEARANCE ─── */}
        <SectionCard
          icon={Palette}
          title="Appearance"
          description="Customise the interface theme and display preferences."
        >
          <SettingsRow label="Theme" description="Choose how the interface looks.">
            <div className="flex gap-2">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                const active = theme === value;
                return (
                  <button
                    key={value}
                    onClick={() => handleTheme(value)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                        : 'border-white/8 bg-white/5 text-slate-400 hover:border-violet-500/30 hover:text-violet-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                    {active && <Check className="h-3 w-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </SettingsRow>
        </SectionCard>
      </div>

      {/* ─── API CONFIGURATION ─── */}
      <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-violet-300">API Configuration</h3>
          </div>

          {/* Connection status badge */}
          {connStatus === 'success' && (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <Wifi className="h-3.5 w-3.5" />
              Connected
            </span>
          )}
          {connStatus === 'error' && (
            <span className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400">
              <WifiOff className="h-3.5 w-3.5" />
              Connection Failed
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">Backend API URL</p>
            <code className="rounded-lg bg-slate-800/80 border border-white/5 px-3 py-1.5 font-mono text-sm text-violet-300">
              {apiUrl}
            </code>
            {connStatus === 'success' && connService && (
              <p className="mt-1.5 text-[11px] text-emerald-500">
                Service: <span className="font-medium">{connService}</span>
              </p>
            )}
          </div>

          <button
            onClick={handleTestConnection}
            disabled={connStatus === 'loading'}
            className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
          >
            {connStatus === 'loading' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wifi className="h-3.5 w-3.5" />
            )}
            {connStatus === 'loading' ? 'Testing…' : 'Test Connection'}
          </button>
        </div>
      </div>
    </div>
  );
}
