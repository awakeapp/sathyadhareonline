'use client';

import React, { useState } from 'react';
import { LucideIcon, Search, Bell, Plus, Settings, Eye } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { globalSearchAction, SearchResult, ADMIN_PAGES } from '@/app/admin/search-actions';
import { useTransition, useEffect, useRef } from 'react';
import { ArrowRight, FileText, Library, Users, Send, Layers, MessageSquare, LayoutDashboard } from 'lucide-react';

/* ─── Presence Layout Wrapper ─── */
export function PresenceWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`min-h-[100svh] bg-[var(--color-background)] pb-[100px] flex flex-col items-center ${className}`}
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 60px)' }}
    >
      <div className="w-full max-w-[1400px] px-4 pb-6 pt-4 flex flex-col gap-4 sm:gap-6">
        {children}
      </div>
    </div>
  );
}

export function PresenceHeader({ 
  title = "Super Admin", 
  roleLabel,
  profileName,
  initials,
  icon1Node,
  icon2Node,
  icon1Href,
  icon2Href,
  icon2Badge = false,
  renderActions
}: { 
  title?: string; 
  roleLabel?: string; 
  profileName?: string;
  initials?: string; 
  renderActions?: React.ReactNode;
  icon1Node?: React.ReactNode;
  icon2Node?: React.ReactNode;
  icon1Href?: string; 
  icon2Href?: string; 
  icon2Badge?: boolean;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [serverResults, setServerResults] = useState<SearchResult[]>([]);
  const [isSearching, startSearch] = useTransition();
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Truly instant local filtering
  const localResults = React.useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return ADMIN_PAGES
      .filter(p => p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q))
      .map((p, i) => ({
        id: `local-page-${i}`,
        title: p.title,
        subtitle: p.subtitle,
        type: 'page' as const,
        href: p.href
      }));
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setServerResults(prev => prev.length > 0 ? [] : prev);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      startSearch(async () => {
        const results = await globalSearchAction(searchQuery);
        setServerResults(results.filter(r => r.type !== 'page'));
      });
    }, 150);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, serverResults.length]);

  async function handleSignOut() {
    setIsProfileOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const displayResults = React.useMemo(() => {
    return [...localResults, ...serverResults];
  }, [localResults, serverResults]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText className="w-4 h-4" />;
      case 'category': return <Library className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      case 'submission': return <Send className="w-4 h-4" />;
      case 'sequel': return <Layers className="w-4 h-4" />;
      case 'comment': return <MessageSquare className="w-4 h-4" />;
      case 'page': return <LayoutDashboard className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Notifications Panel Modal */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-[60] flex sm:items-start justify-end sm:pt-16 sm:pr-4 bg-black/20 dark:bg-black/60 backdrop-blur-md sm:bg-transparent sm:backdrop-blur-none" onClick={() => setIsNotifOpen(false)}>
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

      {/* Profile/Settings Drawer Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[60] flex sm:items-start justify-end sm:pt-16 sm:pr-4 bg-black/20 dark:bg-black/60 backdrop-blur-md sm:bg-transparent sm:backdrop-blur-none" onClick={() => setIsProfileOpen(false)}>
          <div className="bg-[var(--color-surface)] sm:rounded-2xl w-full h-full sm:h-auto sm:w-[360px] sm:max-h-[85vh] shadow-2xl border border-[var(--color-border)] flex flex-col animate-slide-left sm:animate-in sm:fade-in sm:slide-in-from-right-4" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[var(--color-text)]">Account</h3>
              <button onClick={() => setIsProfileOpen(false)} className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-border)] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 pb-safe flex flex-col gap-6">
              
              <div className="flex items-center gap-4 bg-[var(--color-surface)]">
                <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-xl border border-[var(--color-primary)]/20 shadow-sm">
                  {initials || 'A'}
                </div>
                <div>
                  <h4 className="text-[16px] font-bold text-[var(--color-text)] leading-tight">{profileName || 'Super Admin'}</h4>
                  <p className="text-[12px] font-medium text-[var(--color-muted)] uppercase tracking-wider mt-1">{roleLabel || 'Administrator'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[var(--color-surface-2)] rounded-2xl border border-[var(--color-border)]">
                <span className="text-[14px] font-bold text-[var(--color-text)]">Theme Mode</span>
                <ThemeSwitcher />
              </div>

              <div className="flex flex-col gap-1">
                <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center justify-between w-full px-4 py-3.5 text-[14px] font-bold text-[var(--color-text)] bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] transition-colors rounded-2xl border border-[var(--color-border)]">
                  Edit Profile
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-muted)]"><path d="M9 18l6-6-6-6"/></svg>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-between w-full px-4 py-3.5 text-[14px] font-bold text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 transition-colors rounded-2xl border border-rose-500/10 mt-2 text-left"
                >
                  Logout
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[calc(env(safe-area-inset-top)+60px)] sm:pt-[100px] bg-black/20 dark:bg-black/60 backdrop-blur-md px-4 pb-4" onClick={() => setIsSearchOpen(false)}>
          <div className="bg-[var(--color-surface)] rounded-2xl w-full max-w-[600px] max-h-full shadow-2xl overflow-hidden flex flex-col animate-slide-up sm:animate-in sm:fade-in sm:zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-3 border-b border-[var(--color-border)]">
              <Search className="w-5 h-5 text-[var(--color-muted)] ml-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none focus:ring-0 text-[16px] text-[var(--color-text)] placeholder:text-[var(--color-muted)]/50 py-2 outline-none! shadow-none!"
                autoFocus
              />
              <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="px-3 py-1.5 text-[13px] font-medium bg-[var(--color-surface-2)] rounded-lg text-[var(--color-muted)]">
                ESC
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[60vh]">
              {isSearching && (
                <div className="p-8 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!isSearching && searchQuery.length >= 2 && displayResults.length === 0 && (
                <div className="p-12 text-center">
                   <Search className="w-12 h-12 text-[var(--color-muted)] opacity-20 mx-auto mb-4" />
                   <p className="text-[15px] font-bold text-[var(--color-text)]">No results found for &ldquo;{searchQuery}&rdquo;</p>
                   <p className="text-[13px] text-[var(--color-muted)] mt-1">Try a different search term.</p>
                </div>
              )}

              {!isSearching && searchQuery.length < 2 && (
                <div className="p-12 text-center">
                  <Search className="w-12 h-12 text-[var(--color-muted)] opacity-20 mx-auto mb-4" />
                  <p className="text-[15px] font-bold text-[var(--color-text)]">Global Search</p>
                  <p className="text-[13px] text-[var(--color-muted)] mt-1">Search across articles, users, categories and more.</p>
                </div>
              )}

              {displayResults.length > 0 && (
                <div className="p-2 flex flex-col gap-1">
                  {displayResults.map((res) => (
                    <Link 
                      key={`${res.type}-${res.id}`} 
                      href={res.href} 
                      onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-[var(--color-surface-2)] transition-all group border border-transparent hover:border-[var(--color-border)]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)] transition-colors">
                          {getIcon(res.type)}
                        </div>
                        <div>
                          <h4 className="text-[15px] font-bold text-[var(--color-text)] leading-tight">{res.title}</h4>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)] mt-1">{res.subtitle}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/95 backdrop-blur-xl border-b border-[var(--color-border)] shadow-sm flex flex-col justify-end"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* 56-64px Header Height */}
        <div className="flex items-center justify-between h-[60px] px-4 w-full max-w-[1400px] mx-auto">
          <div className="flex flex-col justify-center">
            {/* Page Title: 22px */}
            <h1 className="text-[22px] font-bold tracking-tight text-[var(--color-text)] leading-[1.5]">{title}</h1>
            <button id="global-search-trigger" onClick={() => setIsSearchOpen(true)} className="hidden" aria-hidden="true"></button>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {renderActions}
            {/* Reader Mode Action */}
            <button 
               onClick={() => {
                 try {
                   localStorage.setItem('sathyadhare:readerMode', 'true');
                   document.cookie = `sathyadhare:readerMode=true; path=/; max-age=31536000`;
                 } catch {}
                 window.location.href = '/';
               }} 
               className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-full font-bold transition-all active:scale-95 hover:bg-[var(--color-surface-2)] border border-[var(--color-border)]"
               title="Switch to Reader Mode"
               style={{ color: 'var(--color-primary)' }}
            >
               <Eye className="w-4 h-4" />
               <span className="text-[11px] uppercase tracking-widest">Reader Mode</span>
            </button>
            <button 
               onClick={() => {
                 try {
                   localStorage.setItem('sathyadhare:readerMode', 'true');
                   document.cookie = `sathyadhare:readerMode=true; path=/; max-age=31536000`;
                 } catch {}
                 window.location.href = '/';
               }} 
               className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--color-surface-2)] transition-colors text-[var(--color-primary)]"
               title="Switch to Reader Mode"
            >
               <Eye className="w-5 h-5" />
            </button>
            
            {/* Dynamic Action 1 (e.g. Submissions) */}
            {icon1Node && (
              <Link href={icon1Href || '#'} className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--color-surface-2)] transition-colors">
                {icon1Node}
              </Link>
            )}

            {!icon1Node && (
              <Link href="/admin/articles/new" className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--color-surface-2)] transition-colors">
                <Plus className="w-5 h-5 text-[var(--color-text)]" strokeWidth={1.5} />
              </Link>
            )}

            {/* Dynamic Action 2 (e.g. Notifications/Logs) */}
            <button onClick={() => setIsNotifOpen(true)} className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--color-surface-2)] transition-colors">
              {icon2Node || <Bell className="w-5 h-5 text-[var(--color-text)]" strokeWidth={1.5} />}
              {icon2Badge && <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[var(--color-surface)]" />}
            </button>

            {/* User Settings Trigger */}
            <button
               onClick={() => setIsProfileOpen(true)}
               className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-2)] transition-colors ml-1 shrink-0 text-[var(--color-text)]"
            >
              <Settings className="w-5 h-5" strokeWidth={1.5} />
            </button>
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

/* ─── Global Search Bar Client Component ─── */
export function GlobalSearchBar() {
  return (
    <div 
       onClick={() => {
         const btn = document.getElementById('global-search-trigger');
         if(btn) btn.click();
       }}
       className="w-full h-[52px] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center px-4 cursor-text transition-all hover:bg-[var(--color-surface-2)] active:scale-[0.99] mt-2"
    >
       <Search className="w-5 h-5 text-[var(--color-muted)]/50" />
       <span className="ml-3 text-[15px] font-medium text-[var(--color-muted)]/50">Search</span>
    </div>
  );
}

/* ─── Presence Stat Circle (Refined) ─── */
export function PresenceStatCircle({ 
  percent, 
  label, 
  value,
  color = "#685de6"
}: { 
  percent: number; 
  label: string; 
  value: string | number;
  color?: string;
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
