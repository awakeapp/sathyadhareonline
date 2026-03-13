'use client';

import React, { useEffect, useRef } from 'react';
import { LucideIcon, Search, Bell, Plus } from 'lucide-react';
import Link from 'next/link';

/* ─── Presence Layout Wrapper ─── */
export function PresenceWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`min-h-screen bg-[var(--color-background)] pb-[100px] pt-[var(--admin-header-h,60px)] flex flex-col items-center ${className}`}
    >
      <div className="w-full max-w-[1400px] px-2 sm:px-4 pb-6 pt-2 flex flex-col gap-4 sm:gap-6">
        {children}
      </div>
    </div>
  );
}

/* ─── Presence Header ─── */
export function PresenceHeader({ 
  title = "Super Admin", 
  roleLabel,
  initials,
  icon1: Icon1,
  icon2: Icon2,
  icon1Node,
  icon2Node,
  icon1Href,
  icon2Href,
  icon1Badge = false,
  icon2Badge = false
}: { 
  title?: string; 
  roleLabel?: string; 
  initials?: string; 
  icon1?: LucideIcon; 
  icon2?: LucideIcon;
  icon1Node?: React.ReactNode;
  icon2Node?: React.ReactNode;
  icon1Href?: string; 
  icon2Href?: string; 
  icon1Badge?: boolean;
  icon2Badge?: boolean;
}) {
  const headerRef = React.useRef<HTMLDivElement>(null);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);

  React.useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty(
        '--admin-header-h',
        `${el.getBoundingClientRect().height}px`
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      {/* Notifications Panel Modal */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-[60] flex sm:items-start justify-end sm:pt-16 sm:pr-4 bg-black/20 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none" onClick={() => setIsNotifOpen(false)}>
          <div className="bg-[var(--color-surface)] sm:rounded-2xl w-full h-full sm:h-auto sm:w-[380px] sm:max-h-[80vh] shadow-2xl border border-[var(--color-border)] flex flex-col animate-slide-up sm:animate-in sm:fade-in sm:slide-in-from-top-4" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[var(--color-text)]">Notifications</h3>
              <button onClick={() => setIsNotifOpen(false)} className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 pb-safe">
              {[
                { title: 'Content Update', desc: 'New article published by Editor.', time: '2m ago' },
                { title: 'Submission Alert', desc: 'Guest article awaiting review.', time: '1h ago' },
                { title: 'Community Action', desc: 'New comment reported.', time: '3h ago' },
                { title: 'System Alert', desc: 'Weekly backup completed successfully.', time: '1d ago' },
              ].map((n, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer active:scale-[0.98]">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--color-text)] leading-tight">{n.title}</p>
                    <p className="text-[13px] text-[var(--color-muted)] mt-1">{n.desc}</p>
                    <p className="text-[11px] text-[var(--color-muted)] mt-2 font-medium">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-[var(--color-border)]">
              <Link href="/admin/audit-logs" onClick={() => setIsNotifOpen(false)} className="block w-full text-center py-2 text-[14px] font-medium text-[var(--color-primary)] hover:bg-[var(--color-surface-2)] rounded-lg">
                View All Activity
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[calc(env(safe-area-inset-top)+60px)] sm:pt-[100px] bg-black/60 backdrop-blur-sm px-4 pb-4" onClick={() => setIsSearchOpen(false)}>
          <div className="bg-[var(--color-surface)] rounded-2xl w-full max-w-[600px] max-h-full shadow-2xl overflow-hidden flex flex-col animate-slide-up sm:animate-in sm:fade-in sm:zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-3 border-b border-[var(--color-border)]">
              <Search className="w-5 h-5 text-[var(--color-muted)] ml-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Search articles, authors, categories, or users..." 
                className="flex-1 bg-transparent border-none focus:ring-0 text-[16px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] py-2 outline-none! shadow-none!"
                autoFocus
              />
              <button onClick={() => setIsSearchOpen(false)} className="px-3 py-1.5 text-[13px] font-medium bg-[var(--color-surface-2)] rounded-lg text-[var(--color-muted)]">
                ESC
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center min-h-[200px]">
              <Search className="w-10 h-10 text-[var(--color-muted)] opacity-30 mb-3" />
              <p className="text-[14px] font-medium text-[var(--color-text)]">Start typing to search globally.</p>
              <p className="text-[13px] text-[var(--color-muted)] mt-1">Results will appear here categorized.</p>
            </div>
          </div>
        </div>
      )}

      <div 
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/95 backdrop-blur-xl border-b border-[var(--color-border)] shadow-sm flex flex-col justify-end"
        style={{ paddingTop: 'calc(env(safe-area-inset-top))' }}
      >
        {/* 56-64px Header Height */}
        <div className="flex items-center justify-between h-[60px] px-4 w-full max-w-[1400px] mx-auto">
          <div className="flex flex-col justify-center">
            {/* Page Title: 22px */}
            <h1 className="text-[22px] font-bold tracking-tight text-[var(--color-text)] leading-[1.5]">{title}</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Action */}
            <button onClick={() => setIsSearchOpen(true)} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--color-surface-2)] transition-colors">
              <Search className="w-5 h-5 text-[var(--color-text)]" strokeWidth={1.5} />
            </button>
            
            {/* Create Quick Link (Desktop primarily, mobile has + tab) */}
            <Link href="/admin/articles/new" className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--color-surface-2)] transition-colors">
              <Plus className="w-5 h-5 text-[var(--color-text)]" strokeWidth={1.5} />
            </Link>

            {/* Notifications Action */}
            <button onClick={() => setIsNotifOpen(true)} className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--color-surface-2)] transition-colors">
              <Bell className="w-5 h-5 text-[var(--color-text)]" strokeWidth={1.5} />
              {icon2Badge && <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[var(--color-surface)]" />}
            </button>

            {/* User Avatar */}
            <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center text-[14px] font-bold text-[var(--color-primary)] ml-1 shrink-0 cursor-pointer">
              {initials || 'A'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Presence Card ─── */
export function PresenceCard({ children, className = "", noPadding = false, onClick }: { children: React.ReactNode; className?: string; noPadding?: boolean; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      /* Card padding: 16px (p-4), Border radius: 12px (rounded-xl) */
      className={`bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden ${noPadding ? '' : 'p-4'} ${onClick ? 'cursor-pointer active:scale-[0.99] hover:bg-[var(--color-surface-2)] transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Presence Stat Circle (Refined) ─── */
export function PresenceStatCircle({ 
  percent, 
  label, 
  value,
  color = "#685de6",
  showPercent = false
}: { 
  percent: number; 
  label: string; 
  value: string | number;
  color?: string;
  showPercent?: boolean;
}) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-[var(--color-border)]"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Card Title: 16-18px */}
          <span className="text-[16px] font-bold leading-none text-[var(--color-text)]">{value}</span>
        </div>
      </div>
      {/* Metadata: 12-13px */}
      <span className="text-[12px] font-medium text-[var(--color-muted)]">{label}</span>
    </div>
  );
}

/* ─── Presence Action Tile (Grid Layout) ─── */
export function PresenceActionTile({ 
  href, 
  icon: Icon, 
  iconNode,
  label, 
  badge,
  className = "" 
}: { 
  href: string; 
  icon?: LucideIcon; 
  iconNode?: React.ReactNode;
  label: string; 
  badge?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-2 p-3 transition-colors hover:bg-[var(--color-surface-2)] rounded-xl group ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] group-hover:border-[var(--color-primary)] group-hover:text-[var(--color-primary)] transition-colors duration-200">
          {iconNode ? iconNode : Icon ? <Icon className="w-6 h-6" strokeWidth={1.5} /> : null}
        </div>
        {badge && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-[var(--color-surface)] rounded-full" />
        )}
      </div>
      {/* Body text/Metadata: 12-13px for dense tiles */}
      <span className="text-[12px] font-medium text-[var(--color-muted)] group-hover:text-[var(--color-primary)] text-center transition-colors duration-200">
        {label}
      </span>
    </Link>
  );
}

/* ─── Presence Button ─── */
export function PresenceButton({ 
  children, 
  onClick, 
  disabled, 
  type = "button",
  loading = false,
  variant = "primary",
  className = "" 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  type?: "button" | "submit" | "reset";
  loading?: boolean;
  variant?: "primary" | "outline" | "destructive";
  className?: string 
}) {
  const variantStyles = {
    primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90",
    outline: "bg-transparent border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
    destructive: "bg-rose-600 text-white hover:bg-rose-700"
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      /* Large tap targets: min 48px height */
      className={`px-4 min-h-[48px] rounded-lg text-[14px] font-medium shadow-sm transition-colors flex items-center justify-center gap-2 ${variantStyles[variant]} ${className}`}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-[var(--color-surface)] border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

/* ─── Presence Section Header ─── */
export function PresenceSectionHeader({ title, action, actionHref }: { title: string; action?: string; actionHref?: string }) {
  return (
    <div className="flex items-center justify-between pb-2">
      {/* Card/Section Title: 16-18px */}
      <h2 className="text-[17px] font-semibold text-[var(--color-text)] leading-[1.5]">{title}</h2>
      {action && actionHref && (
        <Link href={actionHref} className="text-[14px] font-medium text-[var(--color-primary)] hover:underline min-h-[48px] flex items-center">
          {action}
        </Link>
      )}
    </div>
  );
}
