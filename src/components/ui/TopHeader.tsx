'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useReaderMode } from '@/context/ReaderModeContext';
import { useTheme } from 'next-themes';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ArrowLeft, Bell, Eye, Maximize2, User as UserIcon, Plus } from 'lucide-react';
import { SA_SECTIONS, ADMIN_SECTIONS, EDITOR_SECTIONS } from '../navigation/nav-items';


interface TopHeaderProps {
  user: User | null;
  role?: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null;
}

export default function TopHeader({ user, role }: TopHeaderProps) {
  const pathname = usePathname();

  // ── Reader‑mode context ──────────────────────────────────────────────────
  const { disableReaderMode } = useReaderMode();

  const isAuthPage       = pathname === '/login' || pathname === '/signup';
  const isAdminRoute     = pathname.startsWith('/admin') || pathname.startsWith('/editor');
  const isPrivilegedRole = role === 'super_admin' || role === 'admin' || role === 'editor';
  // Check if we are on ANY article reading page
  const isArticlePage    = pathname.includes('/articles/') && !pathname.includes('/new') && !pathname.includes('/edit');

  // "Reader Mode" is active when a privileged user is NOT on an admin route
  // AND has explicitly activated it (or is browsing the reader site)
  // We use isAdminRoute to determine what navigation buttons to show.
  const isOnReaderSide   = !isAdminRoute && !isAuthPage;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);
  
  const currentTheme = mounted ? (theme === 'system' ? resolvedTheme : theme) : 'dark';


  const [clientUser, setClientUser] = useState<User | null>(user);

  useEffect(() => {
    const { data: authListener } = createClient().auth.onAuthStateChange((_event, session) => {
      setClientUser(session?.user || null);
      // If user logs out, clear reader mode from localStorage (matches context storage)
      if (!session?.user) {
        try { localStorage.removeItem('sathyadhare:readerMode') } catch {}
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ── Hydration guard for reader-mode UI ─────────────────────────────────────
  // readerMode is read from localStorage on the client. During SSR/first render
  // it is always `false`. We wait one frame after mount before trusting it, so
  // the banner and return buttons don't flicker in/out on page load.
  useEffect(() => {
    const id = requestAnimationFrame(() => {});
    return () => cancelAnimationFrame(id);
  }, []);

  // ── Scroll Tracking ──────────────────────────────────────────
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Don't hide header if we're near the top (e.g., top 100px)
      if (currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && isVisible) {
        // Scrolling down - hide
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY && !isVisible) {
        // Scrolling up - show
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    const handleToggleMenu = () => setIsMenuOpen((prev) => !prev);
    window.addEventListener('toggle-drawer', handleToggleMenu);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('toggle-drawer', handleToggleMenu);
    };
  }, [lastScrollY, isVisible]);

  // (Theme is now handled by next-themes via ThemeProvider on the root html element)

  // Label for the "return to dashboard" button
  const dashboardLabel =
    role === 'super_admin' ? 'Super Admin Dashboard' :
    role === 'admin'       ? 'Admin Dashboard' :
    role === 'editor'      ? 'Editor Dashboard' : '';

  const dashboardHref =
    role === 'super_admin' || role === 'admin' ? '/admin' :
    role === 'editor' ? '/editor' : '/';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.classList.toggle('lock-scroll', isMenuOpen);
    }
  }, [isMenuOpen]);

  // Handler: trigger fullscreen via custom event
  function handleToggleFullscreen() {
    import('@/lib/haptics').then(({ haptics }) => haptics.impact('medium'));
    window.dispatchEvent(new CustomEvent('toggle-fullscreen'));
  }

  // Handler: enable reader mode and navigate to reader homepage
  function handleSwitchToReader() {
    import('@/lib/haptics').then(({ haptics }) => haptics.success());
    // Store dashboard metadata so ReaderModeBar can display the return button
    // without any server props (pure localStorage read on the reader page)
    try {
      const dashUrl   = dashboardHref
      const dashLabel =
        role === 'super_admin' ? 'Super Admin Dashboard' :
        role === 'admin'       ? 'Admin Dashboard' : 'Editor Dashboard'
      const color =
        role === 'super_admin' ? '#7c3aed' :
        role === 'admin'       ? '#0047ff' : '#6d28d9'
      localStorage.setItem('sathyadhare:readerMode',     'true')
      localStorage.setItem('sathyadhare:dashboardUrl',   dashUrl)
      localStorage.setItem('sathyadhare:dashboardLabel', dashLabel)
      localStorage.setItem('sathyadhare:dashboardColor', color)
      document.cookie = `sathyadhare:readerMode=true; path=/; max-age=31536000`
    } catch { /* ignore */ }
    window.location.href = '/';
  }

  // Handler: disable reader mode and navigate to their dashboard
  function handleReturnToDashboard() {
    import('@/lib/haptics').then(({ haptics }) => haptics.impact('medium'));
    disableReaderMode()
    try {
      document.cookie = 'sathyadhare:readerMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    } catch {}
    // Hard navigate so fresh chunks and cleared readerMode are both in effect
    window.location.href = dashboardHref
  }

  // Don't render nav chrome on auth pages
  if (isAuthPage) return null;
  // CRIT-02: On admin/editor routes the PresenceHeader handles everything.
  // Return null so no TopHeader markup (including the reader banner) can
  // ever overlap the PresenceHeader — even if reader mode is accidentally on.
  if (isAdminRoute) return null;

  return (
    <>
      {!isAdminRoute && (
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-transform duration-500 cubic-bezier(0.16,1,0.3,1) glass-ribbon`}
        style={{
          paddingTop: 'var(--safe-top)',
          transform: isVisible ? 'translateY(0)' : 'translateY(-64px)'
        }}
      >
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link href={isAdminRoute ? dashboardHref : '/'} className="flex items-center flex-shrink-0 transition-transform active:scale-95">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
              alt="Sathyadhare Logo"
              className="h-[28px] min-w-[110px] object-left object-contain"
              suppressHydrationWarning
            />
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            
            {/* ── Primary Create Button for Staff ONLY ── */}
            {isPrivilegedRole && (
              <Link
                href="/editor/articles/new"
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-primary)] text-black shadow-lg shadow-[var(--color-primary)]/20 transition-transform active:scale-[0.85] hover:scale-105"
                title="Create New Article"
              >
                <Plus className="w-5 h-5" strokeWidth={3} />
              </Link>
            )}

            {/* ── Switch to Reader Mode button (admin route → reader side) ── */}
            {isPrivilegedRole && isAdminRoute && (
              <button
                id="switch-reader-mode-btn"
                onClick={handleSwitchToReader}
                className="flex items-center gap-2 px-3.5 h-9 rounded-xl font-bold transition-transform active:scale-95 hover:scale-105"
                style={{ background: 'rgba(255,229,0,0.15)', color: '#ffe500', border: '1px solid rgba(255,229,0,0.35)' }}
                title="Switch to Reader Mode"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
                <span className="text-[11px] uppercase tracking-widest">Reader Mode</span>
              </button>
            )}

            {/* ── Return to Dashboard button — ONLY on home page ── */}
            {isPrivilegedRole && isOnReaderSide && pathname === '/' && (
              <Link
                id="return-dashboard-btn"
                href={role === 'super_admin' || role === 'admin' ? '/admin' : '/editor'}
                className="flex items-center gap-1 px-2.5 h-7 rounded-full font-bold transition-transform active:scale-95 hover:bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] mr-1"
                title={`Return to ${dashboardLabel}`}
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span className="text-[9px] uppercase tracking-wider leading-none font-black mt-px">Dash</span>
              </Link>
            )}

            {/* ── Article reading controls in header ── */}
            {isArticlePage && (
              <div className="flex items-center gap-1 mr-1">
                <button
                  onClick={handleToggleFullscreen}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-all active:scale-90"
                  title="Fit to Screen"
                >
                  <Maximize2 className="w-4.5 h-4.5" strokeWidth={2.2} />
                </button>
                <div className="w-9 h-9 flex items-center justify-center">
                  <ThemeSwitcher />
                </div>
              </div>
            )}

            {/* ── Global Header Actions (Theme, Profile) — hidden on ALL article pages ── */}
            {!isArticlePage && !(isPrivilegedRole && isArticlePage) && (
              <div className="flex items-center gap-1.5 ml-1">

                {/* Notification Bell */}
                {clientUser && (
                  <Link
                    href="/profile/history"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text)] hover:bg-[var(--color-surface)] bg-[var(--color-surface)] border border-[var(--color-border)] transition-transform active:scale-90 shadow-sm relative"
                    title="Notifications"
                  >
                    <Bell className="w-[15px] h-[15px]" strokeWidth={2.5} />
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-[#181623] rounded-full" />
                  </Link>
                )}

                {/* Global Theme Switcher */}
                <div className="w-8 h-8 flex items-center justify-center">
                  <ThemeSwitcher />
                </div>

                {/* Profile Drawer Trigger */}
                <button
                  onClick={() => {
                    import('@/lib/haptics').then(({ haptics }) => haptics.impact('light'));
                    setIsMenuOpen(true);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text)] hover:bg-[var(--color-surface)] bg-[var(--color-surface)] border border-[var(--color-border)] transition-transform active:scale-90 ml-1 shadow-sm"
                  title="Profile"
                  aria-label="Open profile"
                >
                  <UserIcon className="w-[15px] h-[15px]" strokeWidth={2.5} />
                </button>
              </div>
            )}
        </div>
      </div>
    </header>
    )}

      {/* ── Drawer overlay (moved out of header to escape backdrop stacking context) ────────────────────────────────────────── */}
      {isMenuOpen && (
        <div
            className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          >
            {/* Sidebar drawer */}
            <div
              className="w-[85%] max-w-[340px] h-full shadow-2xl flex flex-col relative overflow-hidden"
              style={{
                background: 'var(--color-background)',
                paddingTop: 'env(safe-area-inset-top)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-[var(--color-border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
                  alt="Sathyadhare"
                  className="h-[24px] object-contain"
                  suppressHydrationWarning
                />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-none">
                {isAdminRoute ? (
                  /* ─── ADMIN drawer: minimal ─────────────────────── */
                  <nav className="px-5 py-6 flex flex-col gap-3">
                    {(() => {
                      const sections = role === 'super_admin' ? SA_SECTIONS : role === 'admin' ? ADMIN_SECTIONS : EDITOR_SECTIONS;
                      return sections.flatMap(section => section.items).map((item, idx) => {
                        if (item.readerToggle) return null;
                        const Component = item.icon as React.ElementType;
                        return (
                          <Link key={idx} href={item.href} onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 py-3 text-sm font-semibold text-[var(--color-text)] hover:text-[#ffe500] transition-colors">
                            <Component className="w-5 h-5" />
                            {item.label}
                          </Link>
                        );
                      });
                    })()}


                    <div className="h-px bg-[var(--color-border)] my-2" />
                    
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm font-semibold text-[var(--color-text)]">Theme</span>
                      <ThemeSwitcher />
                    </div>

                    <Link href="/profile" onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-sm font-semibold text-[var(--color-text)] hover:text-[#ffe500] transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      My Profile
                    </Link>

                    <button
                      onClick={() => { setIsMenuOpen(false); handleSwitchToReader(); }}
                      className="flex items-center gap-3 py-3 text-sm font-semibold text-[#ffe500] hover:opacity-80 transition-opacity text-left"
                    >
                      <Eye className="w-5 h-5 text-current" /> Switch to Reader Mode
                    </button>

                    <Link
                      href="/"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors text-left"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                      Back to Site
                    </Link>
                    <Link href="/logout" onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Logout
                    </Link>
                  </nav>
                ) : (
                  /* ─── SETTINGS / ACCOUNT PANEL ───────────────── */
                  <div className="px-5 py-5 flex flex-col gap-2">

                    {/* User identity card */}
                    {clientUser ? (
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--color-surface-2)] mb-3">
                        <div className="w-12 h-12 rounded-full bg-[#685de6]/10 border-2 border-[#685de6]/20 flex items-center justify-center shrink-0">
                          <svg className="w-6 h-6 text-[#685de6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-muted)] mb-0.5">Signed in as</p>
                          <p className="text-sm font-bold text-[var(--color-text)] truncate">{clientUser.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-[#685de6]/5 border border-[#685de6]/15 mb-3 text-center">
                        <p className="text-sm font-bold text-[var(--color-text)] mb-3">Sign in to unlock full access</p>
                        <div className="flex gap-2">
                          <Link href="/login" onClick={() => setIsMenuOpen(false)}
                            className="flex-1 py-2.5 rounded-xl bg-[#685de6] text-white text-[12px] font-black uppercase tracking-widest text-center active:scale-95 transition-all">
                            Log In
                          </Link>
                          <Link href="/signup" onClick={() => setIsMenuOpen(false)}
                            className="flex-1 py-2.5 rounded-xl border border-[#685de6]/30 text-[#685de6] text-[12px] font-black uppercase tracking-widest text-center active:scale-95 transition-all">
                            Sign Up
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Settings rows */}
                    <div className="flex flex-col divide-y divide-[var(--color-border)] rounded-2xl bg-[var(--color-surface-2)] overflow-hidden">
                      {/* Profile */}
                      <Link href="/profile" onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-[var(--color-surface)] transition-colors active:scale-[0.98]">
                        <div className="w-9 h-9 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)]">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-[var(--color-text)] flex-1">My Profile</span>
                        <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                      </Link>

                      {/* Theme toggle */}
                      <div className="flex items-center gap-3.5 px-4 py-3.5">
                        <div className="w-9 h-9 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)]">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707" /></svg>
                        </div>
                        <span className="text-sm font-semibold text-[var(--color-text)] flex-1">Appearance</span>
                        <ThemeSwitcher />
                      </div>

                      {/* About Us */}
                      <Link href="/about" onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-[var(--color-surface)] transition-colors active:scale-[0.98]">
                        <div className="w-9 h-9 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)]">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" /></svg>
                        </div>
                        <span className="text-sm font-semibold text-[var(--color-text)] flex-1">About Us</span>
                        <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                      </Link>

                      {/* Dashboard link for privileged users */}
                      {isPrivilegedRole && (
                        <button onClick={() => { setIsMenuOpen(false); handleReturnToDashboard(); }}
                          className="flex items-center gap-3.5 px-4 py-3.5 w-full hover:bg-[var(--color-surface)] transition-colors active:scale-[0.98]">
                          <div className="w-9 h-9 rounded-xl bg-[#685de6]/10 border border-[#685de6]/20 flex items-center justify-center text-[#685de6]">
                            <ArrowLeft className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-semibold text-[#685de6] flex-1 text-left">{dashboardLabel}</span>
                        </button>
                      )}

                      {/* Login / Logout */}
                      {clientUser ? (
                        <Link href="/logout" onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-red-500/5 transition-colors active:scale-[0.98]">
                          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                          </div>
                          <span className="text-sm font-semibold text-red-400 flex-1">Sign Out</span>
                        </Link>
                      ) : (
                        <Link href="/login" onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-[var(--color-surface)] transition-colors active:scale-[0.98]">
                          <div className="w-9 h-9 rounded-xl bg-[#685de6]/10 border border-[#685de6]/20 flex items-center justify-center text-[#685de6]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg>
                          </div>
                          <span className="text-sm font-semibold text-[#685de6] flex-1">Log In</span>
                          <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer — readers only */}
              {!isAdminRoute && (
                <div className="bg-[var(--color-surface)] p-5 flex flex-col items-center text-center"
                  style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
                  <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest mb-2">
                    Subscribe
                  </span>
                  <p className="text-xs text-[var(--color-text)] mb-4">Get email updates from Sathyadhare</p>
                  <div className="flex gap-5">
                    {[
                      { name: 'fb', d: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
                      { name: 'ig', d: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 6.5h11a5 5 0 015 5v11a5 5 0 01-5 5h-11a5 5 0 01-5-5v-11a5 5 0 015-5z' },
                      { name: 'yt', d: 'M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29.01 29.01 0 001 11.75a29.13 29.13 0 00.46 5.33 2.78 2.78 0 001.94 2C5.12 19.5 12 19.5 12 19.5s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29.01 29.01 0 00.46-5.33 29.01 29.01 0 00-.46-5.33z' },
                    ].map((s) => (
                      <button key={s.name} className="text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <path d={s.d} />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </>
  );
}
