'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Sparkles,
  LayoutDashboard,
  Clock,
  UploadCloud,
  Blocks,
  BarChart2,
  Mic,
  Cpu,
  Users,
  Settings,
  CreditCard,
  MoreHorizontal,
  ShieldCheck,
  Plus,
  ChevronLeft,
  ChevronRight,
  Lock,
  X
} from 'lucide-react';

const PRIMARY_NAV = [
  { href: '/',               label: 'Home',           icon: Home },
  { href: '#',               label: 'AskFred',        icon: Sparkles },
  { href: '/meetings',       label: 'Meetings',       icon: LayoutDashboard },
  { href: '#',               label: 'Meeting Status', icon: Clock },
  { href: '/uploads',        label: 'Uploads',        icon: UploadCloud },
];

const WORKSPACE_NAV = [
  { href: '#',               label: 'Integrations',   icon: Blocks },
  { href: '#',               label: 'Analytics',      icon: BarChart2 },
  { href: '#',               label: 'Voice Agents',   icon: Mic },
  { href: '#',               label: 'AI Skills',      icon: Cpu },
  { href: '#',               label: 'Team',           icon: Users },
  { href: '/settings',       label: 'Settings',       icon: Settings },
];

const BILLING_NAV = [
  { href: '#',               label: 'Upgrade',        icon: CreditCard },
  { href: '#',               label: 'More',           icon: MoreHorizontal },
];

const PLACEHOLDERS: Record<string, string> = {
  'AskFred': 'AI-powered meeting questions and assistance are coming soon.',
  'Meeting Status': 'Live tracking and recording status of your meetings are coming soon.',
  'Integrations': 'Connect your meeting and productivity tools here. Coming soon.',
  'Analytics': 'Meeting insights and analytics are coming soon.',
  'Voice Agents': 'AI voice agents to automatically join and record calls are coming soon.',
  'AI Skills': 'Custom AI skills and custom vocabulary templates are coming soon.',
  'Team': 'Team collaboration features are coming soon.',
  'Upgrade': 'Upgrade to Pro or Enterprise plans. Coming soon.',
  'More': 'Additional productivity widgets and settings are coming soon.',
};

export default function Sidebar() {
  const pathname = usePathname();

  // Sidebar expanded / collapsed preference state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Coming soon modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [showTeamPromo, setShowTeamPromo] = useState(true);

  // Persist sidebar preference
  useEffect(() => {
    const saved = localStorage.getItem('firefiles-sidebar-collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
      document.body.classList.add('sidebar-collapsed');
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (nextState) {
      document.body.classList.add('sidebar-collapsed');
      localStorage.setItem('firefiles-sidebar-collapsed', 'true');
    } else {
      document.body.classList.remove('sidebar-collapsed');
      localStorage.setItem('firefiles-sidebar-collapsed', 'false');
    }
  };

  const handlePlaceholderClick = (label: string, e: React.MouseEvent) => {
    e.preventDefault();
    const desc = PLACEHOLDERS[label] || 'This feature is currently in development. Coming soon.';
    setModalTitle(label);
    setModalDesc(desc);
    setModalOpen(true);
  };

  const renderLink = ({ href, label, icon: Icon }: any, index: number) => {
    // Determine active route state
    let active = false;
    if (label === 'Home') {
      active = pathname === '/';
    } else if (label === 'Meetings') {
      active = pathname === '/meetings' || pathname.startsWith('/meetings/');
    } else if (label === 'Settings') {
      active = pathname === '/settings';
    } else if (label === 'Uploads') {
      active = pathname === '/uploads';
    }

    const isPlaceholder = href === '#';

    return (
      <Link
        key={`${href}-${label}-${index}`}
        href={href}
        onClick={(e) => {
          // Close mobile drawer overlay on navigation click
          document.body.classList.remove('mobile-sidebar-open');

          if (isPlaceholder) {
            handlePlaceholderClick(label, e);
          }
        }}
        className={`group relative flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
          isCollapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : 'gap-3 w-full'
        } ${
          active
            ? 'bg-violet-50 text-violet-600 shadow-3xs'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
        title={isCollapsed ? label : undefined}
      >
        <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
        {!isCollapsed && <span className="truncate">{label}</span>}
        {!isCollapsed && active && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-600" />
        )}

        {/* Custom CSS Hover Tooltip when sidebar is collapsed */}
        {isCollapsed && (
          <div className="absolute left-full ml-3 px-2 py-1 bg-slate-950 text-white text-[10px] font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-md z-50">
            {label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white sidebar-transition ${
      isCollapsed ? 'sidebar-width-collapsed' : 'sidebar-width-expanded'
    }`}>
      {/* Brand logo & toggle */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-slate-100 relative">
        {!isCollapsed && (
          <>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 shadow-md shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-md font-bold tracking-tight text-slate-800 truncate">
              fireflies.ai
            </span>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600 border border-violet-100 shrink-0">
              PRO
            </span>
          </>
        )}

        {/* Collapse toggle button */}
        <button
          onClick={toggleSidebar}
          className={`flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors shadow-3xs hover:text-slate-800 cursor-pointer ${
            isCollapsed ? 'mx-auto' : 'ml-auto'
          }`}
          title={isCollapsed ? "Open sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav groups container */}
      <div className={`flex-1 overflow-y-auto py-4 space-y-6 scrollbar-thin ${isCollapsed ? 'px-1' : 'px-4'}`}>
        {/* Primary nav group */}
        <div className="space-y-1">
          {PRIMARY_NAV.map((link, idx) => renderLink(link, idx))}
        </div>

        {/* Workspace nav group */}
        <div className="space-y-1.5">
          {!isCollapsed && (
            <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Workspace
            </span>
          )}
          <div className="space-y-0.5">
            {WORKSPACE_NAV.map((link, idx) => renderLink(link, idx))}
          </div>
        </div>

        {/* Billing nav group */}
        <div className="space-y-1">
          {BILLING_NAV.map((link, idx) => renderLink(link, idx))}
        </div>
      </div>

      {/* Footer CTA & Security info */}
      <div className={`border-t border-slate-100 ${isCollapsed ? 'p-1.5' : 'p-4'} flex flex-col gap-3`}>
        {/* Create Team Callout Card */}
        {!isCollapsed && showTeamPromo && (
          <div className="relative rounded-xl bg-violet-50/50 border border-violet-100 p-4 text-center">
            {/* Close button X */}
            <button
              onClick={() => setShowTeamPromo(false)}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-100/50 rounded-md transition-colors cursor-pointer"
              aria-label="Close promotion"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="pr-4 text-xs font-semibold text-slate-700 leading-relaxed text-left font-sans">
              Invite coworkers to your Fireflies team
            </p>
            <button
              onClick={() => {
                setModalTitle("Create a Team");
                setModalDesc("Team collaboration is coming soon.");
                setModalOpen(true);
              }}
              className="mt-3.5 w-full flex items-center justify-center gap-1 rounded-xl bg-violet-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-violet-750 transition-all cursor-pointer font-sans"
            >
              + Create Team
            </button>
          </div>
        )}

        {/* Your Privacy Choices */}
        {isCollapsed ? (
          <Link
            href="/settings"
            className="group relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors mx-auto cursor-pointer"
          >
            <Lock className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
            <div className="absolute left-full ml-3 px-2 py-1 bg-slate-950 text-white text-[10px] font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-md z-50 font-sans">
              Your Privacy Choices
            </div>
          </Link>
        ) : (
          <Link
            href="/settings"
            className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 transition cursor-pointer font-sans"
          >
            <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Your Privacy Choices</span>
          </Link>
        )}
      </div>

      {/* Shared "Coming Soon" Modal for sidebar placeholders */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-slide-in text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-violet-600 mb-3">
              <div className="p-2 bg-violet-50 rounded-xl">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">{modalTitle}</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              {modalDesc}
            </p>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-xl bg-violet-600 hover:bg-violet-750 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all"
              >
                Okay, I understand
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>

    {/* Mobile drawer backdrop overlay */}
    <div
      className="fixed inset-0 z-30 bg-black/45 backdrop-blur-xs md:hidden hidden mobile-backdrop cursor-pointer"
      onClick={() => {
        document.body.classList.remove('mobile-sidebar-open');
      }}
    />
  </>
);
}
