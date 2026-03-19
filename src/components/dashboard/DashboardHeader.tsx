'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Eye, ChevronRight, LogOut, User as UserIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from 'next-themes';

/* ── Types ──────────────────────────────────────────────────────────── */
export interface DashboardUser {
  id: string;
  email?: string;
  user_metadata?: { avatar_url?: string; full_name?: string };
}

export interface DashboardProfile {
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
}

interface Props {
  user: DashboardUser | null;
  profile: DashboardProfile | null;
  role: string;
  /** Compact label shown under the page title, e.g. "Super Admin Dashboard" */
  roleLabel: string;
}

/* ── Role → reader-mode metadata mapping ────────────────────────────── */
function getReaderModeData(role: string) {
  const map: Record<string, { dashUrl: string; dashLabel: string; color: string }> = {
    super_admin: { dashUrl: '/admin',  dashLabel: 'Super Admin Dashboard', color: '#7c3aed' },
    admin:       { dashUrl: '/admin',  dashLabel: 'Admin Dashboard',       color: '#685de6' },
    editor:      { dashUrl: '/editor', dashLabel: 'Editor Dashboard',      color: '#6d28d9' },
  };
  return map[role] ?? { dashUrl: '/', dashLabel: 'Dashboard', color: '#685de6' };
}

/* ── Role badge label ────────────────────────────────────────────────── */
function roleBadge(role: string): string {
  const map: Record<string, string> = {
    super_admin: 'Super Admin',
    admin:       'Admin',
    editor:      'Editor',
    reader:      'Reader',
  };
  return map[role] ?? role;
}

/* ── Path → Page Title mapping ───────────────────────────────────────── */
const PAGE_TITLES: Record<string, string> = {
  '/admin':            'Overview',
  '/editor':           'Workspace',
  '/admin/users':       'People',
  '/admin/inbox':       'Inbox',
  '/admin/settings':    'Settings',
  '/admin/articles':    'Articles',
  '/admin/sequels':     'Sequels',
  '/admin/categories':  'Categories',
  '/admin/library':     'Library',
  '/admin/media':       'Media',
  '/admin/analytics':   'Analytics',
  '/admin/audit-logs':  'Audit Logs',
  '/admin/submissions': 'Submissions',
  '/admin/newsletter':  'Newsletter',
  '/admin/editors':     'Editors',
  '/admin/content':     'Content',
  '/admin/manage':      'Manage',
  '/admin/more':         'More',
  '/admin/financial':    'Financial',
};

function getPageTitle(pathname: string): string {
  // 1. Direct match
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  
  // 2. Fallback: Parse last segment
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1] || 'Dashboard';
  
  // 3. Format: slug-case to Title Case
  return last
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/* ══════════════════════════════════════════════════════════════════════
   DashboardHeader
   — Fixed top bar shared across super_admin / admin / editor dashboards
══════════════════════════════════════════════════════════════════════ */
function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
export default function DashboardHeader({ user, profile, role, roleLabel }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  /* Close panels on route change (Next.js soft-nav) */
  useEffect(() => {
    setMounted(true);
    setIsNotifOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setNotifications(data);
    };
    
    fetchNotifications();

    const channel = supabase.channel('user_notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchNotifications)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string, link: string | null) => {
    const supabase = createClient();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (link) {
      setIsNotifOpen(false);
      router.push(link);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || !user?.id) return;
    const supabase = createClient();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
  };

  const currentTheme = mounted ? (theme === 'system' ? resolvedTheme : theme) : 'dark';

  /* logic: is this the "Home" page of the dashboard? (root /admin or /editor) */
  const isDashboardHome = useMemo(() => {
    return pathname === '/admin' || pathname === '/editor';
  }, [pathname]);

  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  /* Sign out */
  async function handleSignOut() {
    setIsProfileOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/sign-in';
  }

  /* Switch to reader mode — persist metadata so ReaderModeBar can render */
  function handleReaderMode() {
    const meta = getReaderModeData(role);
    try {
      localStorage.setItem('sathyadhare:readerMode',     'true');
      localStorage.setItem('sathyadhare:dashboardUrl',   meta.dashUrl);
      localStorage.setItem('sathyadhare:dashboardLabel', meta.dashLabel);
      localStorage.setItem('sathyadhare:dashboardColor', meta.color);
      document.cookie = `sathyadhare:readerMode=true; path=/; max-age=31536000`;
    } catch { /* ignore */ }
    window.location.href = '/';
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User';
  const avatarUrl   = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initials    = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* ── Notification Panel ─────────────────────────────────────────── */}
      {isNotifOpen && (
        <div
          className="fixed inset-0 z-[60] flex sm:items-start justify-end sm:pt-[72px] sm:pr-4 bg-black/20 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none"
          onClick={() => setIsNotifOpen(false)}
        >
          <div
            className="bg-[var(--color-surface)] w-full h-full sm:h-auto sm:w-[380px] sm:max-h-[80vh] sm:rounded-2xl shadow-xl border border-[var(--color-border)] flex flex-col animate-in slide-in-from-right-4 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <h2 className="text-[17px] font-bold text-[var(--color-text)]">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[11px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllAsRead} className="text-[12px] font-semibold text-[var(--color-primary)] hover:underline">
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-border)] transition-colors min-w-[44px] min-h-[44px]"
                  aria-label="Close notifications"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Notification items */}
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center bg-[var(--color-surface)] flex flex-col items-center justify-center h-full gap-2">
                  <Bell className="w-8 h-8 text-[var(--color-muted)] opacity-30 min-w-[44px] min-h-[44px]" />
                  <p className="text-[14px] text-[var(--color-muted)] font-medium">No notifications yet.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => handleMarkAsRead(n.id, n.link)}
                    className={`flex gap-3 px-5 py-4 cursor-pointer transition-colors ${n.is_read ? 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]' : 'bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10'}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-[var(--color-primary)]'}`} />
                    <div className="min-w-0">
                      <p className={`text-[14px] leading-tight ${n.is_read ? 'font-medium text-[var(--color-text)]' : 'font-bold text-[var(--color-text)]'}`}>{n.title}</p>
                      {n.body && <p className={`text-[13px] mt-0.5 ${n.is_read ? 'text-[var(--color-muted)]/80' : 'text-[var(--color-muted)] font-medium'}`}>{n.body}</p>}
                      <p className="text-[11px] text-[var(--color-muted)] mt-1.5 font-medium">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Profile / Account panel ────────────────────────────────────── */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-start justify-center sm:justify-end sm:pt-[72px] sm:pr-4 bg-black/20 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none"
          onClick={() => setIsProfileOpen(false)}
        >
          <div
            className="bg-[var(--color-surface)] w-full sm:w-[340px] rounded-t-3xl sm:rounded-2xl sm:rounded-t-2xl shadow-xl border border-[var(--color-border)] overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-right-4 duration-200"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* User identity card */}
            <div className="flex items-center gap-4 px-5 py-5 border-b border-[var(--color-border)]">
              {/* Avatar */}
              {avatarUrl && avatarUrl.length > 5 ? (
                <NextImage
                  src={avatarUrl}
                  alt={displayName}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-2xl object-cover border border-[var(--color-border)] shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] font-bold text-xl shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-[var(--color-text)] truncate leading-tight">{displayName}</p>
                {user?.email && (
                  <p className="text-[12px] text-[var(--color-muted)] truncate mt-0.5">{user.email}</p>
                )}
                <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest border border-[var(--color-primary)]/20">
                  {roleBadge(role)}
                </span>
              </div>
            </div>

            {/* Menu rows */}
            <div className="divide-y divide-[var(--color-border)]">
              <Link
                href="/profile"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center justify-between px-5 py-4 hover:bg-[var(--color-surface-2)] transition-colors active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] min-w-[44px] min-h-[44px]">
                    <UserIcon size={16} strokeWidth={2} />
                  </div>
                  <span className="text-[14px] font-semibold text-[var(--color-text)]">Edit Profile</span>
                </div>
                <ChevronRight size={16} className="text-[var(--color-muted)]" />
              </Link>

              <button
                onClick={handleReaderMode}
                className="flex items-center gap-3 w-full px-5 py-4 hover:bg-[var(--color-surface-2)] transition-colors active:scale-[0.99] text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] min-w-[44px] min-h-[44px]">
                  <Eye size={16} strokeWidth={2} />
                </div>
                <span className="text-[14px] font-semibold text-[var(--color-text)]">Switch to Reader Mode</span>
              </button>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-5 py-4 hover:bg-rose-500/5 transition-colors active:scale-[0.99] text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 min-w-[44px] min-h-[44px]">
                  <LogOut size={16} strokeWidth={2} />
                </div>
                <span className="text-[14px] font-semibold text-rose-500">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Top bar — fixed, full-width, 60px tall (+ safe-area-inset-top)
      ══════════════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 sm:px-6"
        style={{ height: 'var(--header-height)' }}
      >
        <div className="flex items-center justify-between h-full w-full max-w-[1400px] mx-auto">
          {/* ── Left: logo (Home) or Title (Sub-pages) ───────────────────────── */}
          <div className="flex-1 min-w-0 flex items-center pr-2">
            {isDashboardHome ? (
              <div className="flex flex-col justify-center gap-0.5 min-w-0">
                <Link href="/" className="flex items-center shrink-0 transition-transform active:scale-95" tabIndex={-1} aria-label="Sathyadhare home">
                  <NextImage
                    src={currentTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
                    alt="Sathyadhare"
                    width={110}
                    height={28}
                    className="h-[28px] w-auto object-left object-contain"
                    priority
                    suppressHydrationWarning
                  />
                </Link>
                <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider leading-none truncate opacity-60">
                  {roleLabel}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 min-w-0">
                <h1 className="text-[20px] font-bold text-[var(--color-text)] tracking-tight truncate">
                  {pageTitle}
                </h1>
              </div>
            )}
          </div>

          {/* ── Right: actions ──────────────────────────────────────── */}
          <div className="flex items-center gap-1">
            {/* Reader mode — text label on sm+, icon-only on mobile */}
            <button
              id="dashboard-reader-mode-btn"
              onClick={handleReaderMode}
              className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-full text-[var(--color-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors active:scale-95 font-bold"
              title="Switch to Reader Mode"
            >
              <Eye size={15} strokeWidth={2} />
              <span className="text-[11px] uppercase tracking-widest">Reader</span>
            </button>
            <button
              onClick={handleReaderMode}
              className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-2)] transition-colors text-[var(--color-primary)] active:scale-95 min-w-[44px] min-h-[44px]"
              title="Switch to Reader Mode"
              aria-label="Switch to Reader Mode"
            >
              <Eye size={20} strokeWidth={2} />
            </button>

            {/* Notification bell */}
            <button
              id="dashboard-notif-btn"
              onClick={() => setIsNotifOpen(true)}
              className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-2)] transition-colors text-[var(--color-text)] active:scale-95 min-w-[44px] min-h-[44px]"
              aria-label="Notifications"
            >
              <Bell size={20} strokeWidth={1.75} />
              {/* Unread badge */}
              {unreadCount > 0 && (
                <div className="absolute top-2 right-2 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-[var(--color-surface)] text-white text-[8px] font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>

            {/* User avatar / initials — opens profile panel */}
            <button
              id="dashboard-profile-btn"
              onClick={() => setIsProfileOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-2)] transition-colors active:scale-95 ml-0.5 shrink-0 min-w-[44px] min-h-[44px]"
              aria-label="Open profile"
              title={displayName}
            >
              {avatarUrl && avatarUrl.length > 5 ? (
                <NextImage
                  src={avatarUrl}
                  alt={displayName}
                  width={34}
                  height={34}
                  className="w-8.5 h-8.5 rounded-full object-cover border border-[var(--color-border)]"
                />
              ) : (
                <div className="w-8.5 h-8.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] text-[13px] font-bold">
                  {initials}
                </div>
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
