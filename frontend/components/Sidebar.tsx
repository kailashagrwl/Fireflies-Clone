'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Mic2,
  Home,
  LayoutDashboard,
  Settings,
  Zap,
  ChevronRight,
} from 'lucide-react';

const NAV = [
  { href: '/',         label: 'Home',      icon: Home },
  { href: '/meetings', label: 'Meetings',  icon: LayoutDashboard },
  { href: '/settings', label: 'Settings',  icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-[#0d0f14] border-r border-white/5">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg">
          <Mic2 className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold tracking-wide text-white">
          Firefiles
        </span>
        <span className="ml-auto rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">
          BETA
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV.map(({ href, label, icon: Icon }, index) => {
          // Custom active state logic:
          // - "Home" is active ONLY on exactly the root "/"
          // - "Meetings" is active on "/meetings" or detail sub-routes "/meetings/[id]"
          // - "Settings" is active on "/settings"
          let active = false;
          if (label === 'Home') {
            active = pathname === '/';
          } else if (label === 'Meetings') {
            active = pathname === '/meetings' || pathname.startsWith('/meetings/');
          } else {
            active = pathname.startsWith(href);
          }

          return (
            <Link
              key={`${href}-${label}-${index}`}
              href={href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-violet-600/20 text-violet-300 shadow-sm'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && (
                <ChevronRight className="ml-auto h-3 w-3 text-violet-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer callout */}
      <div className="m-3 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/20 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-semibold text-violet-300">AI Ready</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          AI summaries &amp; action item extraction coming soon.
        </p>
      </div>
    </aside>
  );
}
