'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useReaderMode } from '@/context/ReaderModeContext';
import { useTheme } from 'next-themes';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ArrowLeft, Eye, User as UserIcon, Search } from 'lucide-react';
import { SA_SECTIONS, ADMIN_SECTIONS, EDITOR_SECTIONS } from '../navigation/nav-items';
import HomeSearchBar from '@/components/ui/HomeSearchBar';


interface TopHeaderProps {
  user: User | null;
  role?: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null;
}

export default function TopHeader({ user, role, profile }: TopHeaderProps) {
  const pathname = usePathname();

  // ── Reader‑mode context ──────────────────────────────────────────────────
  const { disableReaderMode } = useReaderMode();

  const authPaths = ['/login', '/signup', '/forgot-password', '/update-password', '/terms'];
  const isAuthPage = authPaths.includes(pathname);
  const isAdminRoute     = pathname.startsWith('/admin') || pathname.startsWith('/editor');
  const isPrivilegedRole = role === 'super_admin' || role === 'admin' || role === 'editor';
  // Check if we are on ANY article reading page
  const isArticlePage    = pathname.includes('/articles/') && !pathname.includes('/new') && !pathname.includes('/edit');

  // "Reader Mode" is active when a privileged user is NOT on an admin route
  // AND has explicitly activated it (or is browsing the reader site)
  // We use isAdminRoute to determine what navigation buttons to show.
  const isOnReaderSide   = !isAdminRoute && !isAuthPage;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
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
  useEffect(() => {
    const handleToggleMenu = () => setIsMenuOpen((prev) => !prev);
    window.addEventListener('toggle-drawer', handleToggleMenu);
    
    return () => {
      window.removeEventListener('toggle-drawer', handleToggleMenu);
    };
  }, []);

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

  async function handleSignOut() {
    import('@/lib/haptics').then(({ haptics }) => haptics.impact('medium'));
    setIsMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
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
        className={`fixed top-0 left-0 right-0 z-[50] glass-ribbon overflow-visible transition-all duration-500`}
        style={{
          // Tighter vertical rhythm to prevent "Forehead" gap
          height: isSearchOpen ? 'calc(var(--safe-top) + 116px)' : 'calc(var(--safe-top) + 56px)',
        }}
      >
        <div 
          className="flex items-center justify-between h-14 px-4 transition-transform duration-500 cubic-bezier(0.16,1,0.3,1)"
          style={{
            marginTop: 'var(--safe-top)',
            transform: 'translateY(0)',
            opacity: 1
          }}
        >
          {/* Logo */}
          <Link href={isAdminRoute ? dashboardHref : '/'} className="flex items-center flex-shrink-0 transition-transform active:scale-95">
            <NextImage
              src={currentTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
              alt="Sathyadhare Logo"
              width={120}
              height={32}
              className="h-[32px] w-auto object-left object-contain"
              priority
              suppressHydrationWarning
            />
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            
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
                className="flex items-center gap-1.5 px-3 h-8 rounded-full font-bold transition-transform active:scale-95 hover:bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] mr-1"
                title={`Return to ${dashboardLabel}`}
              >
                <ArrowLeft size={16} strokeWidth={2.5} />
                <span className="text-[10px] uppercase tracking-wider leading-none font-black mt-px">Dash</span>
              </Link>
            )}

            {/* ── Article reading controls in header ── */}
            {isArticlePage && (
              <div className="flex items-center gap-1 mr-1">
                <div className="w-10 h-10 flex items-center justify-center">
                  <ThemeSwitcher />
                </div>
              </div>
            )}

            {/* ── Global Search Trigger ── */}
            <button
               onClick={() => {
                 import('@/lib/haptics').then(({ haptics }) => haptics.impact('light'));
                 setIsSearchOpen(p => !p);
               }}
               className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 ml-1 ${isSearchOpen ? 'bg-[var(--color-surface-2)] text-[var(--color-primary)]' : 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'}`}
               title="Search"
            >
               <Search size={22} strokeWidth={2.25} />
            </button>

            {/* ── Global Header Actions (Theme, Profile) — hidden on ALL article pages ── */}
            {!isArticlePage && !(isPrivilegedRole && isArticlePage) && (
              <div className="flex items-center gap-1.5 ml-1">


                {/* Global Theme Switcher */}
                <div className="w-10 h-10 flex items-center justify-center">
                  <ThemeSwitcher />
                </div>

                {/* Profile Drawer Trigger */}
                <button
                  onClick={() => {
                    import('@/lib/haptics').then(({ haptics }) => haptics.impact('light'));
                    setIsMenuOpen(true);
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 ml-1 text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                  title="Profile"
                  aria-label="Open profile"
                >
                  {user?.user_metadata?.avatar_url || profile?.avatar_url ? (
                    <NextImage 
                      src={user?.user_metadata?.avatar_url || profile?.avatar_url || ''} 
                      alt="Profile" 
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover" 
                    />
                  ) : (
                    <UserIcon size={22} strokeWidth={2.25} />
                  )}
                </button>
              </div>
            )}
        </div>
      </div>

      {isSearchOpen && (
        <div className="px-4 pb-3 z-40 relative">
           <HomeSearchBar />
        </div>
      )}
    </header>
    )}

      {/* ── Drawer overlay (moved out of header to escape backdrop stacking context) ────────────────────────────────────────── */}
      {isMenuOpen && (
        <div
            className="fixed inset-0 z-[999] flex justify-end bg-black/60 backdrop-blur-sm"
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
                <NextImage
                  src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
                  alt="Sathyadhare"
                  width={100}
                  height={24}
                  className="h-[24px] w-auto object-contain"
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
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 py-3 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors w-full text-left"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Logout
                    </button>
                  </nav>
                ) : (
                  /* ─── SETTINGS / ACCOUNT PANEL ───────────────── */
                  <div className="px-5 py-5 flex flex-col gap-2">

                    {/* User identity card */}
                    {clientUser ? (
                      <div className="flex items-center gap-4 p-4 rounded-[2rem] bg-[var(--color-surface-2)] border border-[var(--color-border)] mb-4">
                        <div className="relative">
                          {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                            <NextImage 
                              src={profile?.avatar_url || user?.user_metadata?.avatar_url || ''} 
                              alt="Avatar" 
                              width={56}
                              height={56}
                              className="w-14 h-14 rounded-2xl object-cover border-2 border-[var(--color-primary)]/20" 
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center">
                              <UserIcon size={24} className="text-[var(--color-primary)]" />
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[var(--color-background)]" title="Online" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-[var(--color-text)] truncate">{profile?.full_name || 'Reader'}</h4>
                          <p className="text-[10px] font-bold text-[var(--color-muted)] truncate mb-1">{clientUser.email}</p>
                          <div className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[9px] font-black uppercase tracking-widest border border-[var(--color-primary)]/20">
                            {role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : role === 'editor' ? 'Editor' : 'Reader'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-[2rem] bg-[var(--color-surface-2)] border border-[var(--color-border)] mb-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4">
                           <UserIcon size={32} className="text-[var(--color-primary)]" />
                        </div>
                        <h4 className="text-base font-black text-[var(--color-text)] mb-1">Join Sathyadhare</h4>
                        <p className="text-xs font-medium text-[var(--color-muted)] mb-4 leading-relaxed">Sign in to sync your bookmarks and track your reading journey.</p>
                        <div className="flex gap-2">
                          <Link href="/login" onClick={() => setIsMenuOpen(false)}
                            className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest text-center shadow-lg shadow-[var(--color-primary)]/20 active:scale-95 transition-all">
                            Log In
                          </Link>
                          <Link href="/signup" onClick={() => setIsMenuOpen(false)}
                            className="flex-1 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-[10px] font-black uppercase tracking-widest text-center active:scale-95 transition-all">
                            Sign Up
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Quick Access Grid (New) */}
                    {clientUser && (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <Link href="/saved" onClick={() => setIsMenuOpen(false)} 
                          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface)] transition-all group">
                          <svg className="w-5 h-5 text-emerald-500 mb-1.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Saved</span>
                        </Link>
                        <Link href="/profile/history" onClick={() => setIsMenuOpen(false)} 
                          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface)] transition-all group">
                          <svg className="w-5 h-5 text-indigo-500 mb-1.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">History</span>
                        </Link>
                      </div>
                    )}

                    {/* Settings rows */}
                    <div className="flex flex-col divide-y divide-[var(--color-border)] rounded-2xl bg-[var(--color-surface-2)] overflow-hidden">
                      {/* Profile */}
                      <Link href="/profile" onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-[var(--color-surface)] transition-colors active:scale-[0.98]">
                        <div className="w-9 h-9 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)]">
                          <UserIcon size={18} strokeWidth={2.25} />
                        </div>
                        <span className="text-sm font-semibold text-[var(--color-text)] flex-1">Account Settings</span>
                        <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                      </Link>

                      {/* Highlights */}
                      <Link href="/highlights" onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-[var(--color-surface)] transition-colors active:scale-[0.98]">
                        <div className="w-9 h-9 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] text-orange-500">
                          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-[var(--color-text)] flex-1">My Highlights</span>
                        <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                      </Link>

                      {/* Analytics */}
                      <Link href="/profile/analytics" onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-[var(--color-surface)] transition-colors active:scale-[0.98]">
                        <div className="w-9 h-9 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] text-blue-500">
                          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-[var(--color-text)] flex-1">Reading Insights</span>
                        <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                      </Link>

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
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-red-500/5 transition-colors active:scale-[0.98] w-full text-left"
                        >
                          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                          </div>
                          <span className="text-sm font-semibold text-red-400 flex-1">Sign Out</span>
                        </button>
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



            </div>
          </div>
        )}
    </>
  );
}
