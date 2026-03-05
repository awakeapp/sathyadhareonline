'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useReaderMode } from '@/context/ReaderModeContext';
import { useTheme } from 'next-themes';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';


interface TopHeaderProps {
  user: User | null;
  role?: string | null;
}

export default function TopHeader({ user, role }: TopHeaderProps) {
  const pathname = usePathname();
  const router   = useRouter();

  // ── Reader‑mode context ──────────────────────────────────────────────────
  const { readerMode, enableReaderMode, disableReaderMode } = useReaderMode();

  const isAuthPage       = pathname === '/login' || pathname === '/signup';
  const isAdminRoute     = pathname.startsWith('/admin') || pathname.startsWith('/editor');
  const isPrivilegedRole = role === 'super_admin' || role === 'admin' || role === 'editor';

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
      // If user logs out, clear reader mode
      if (!session?.user) {
        try { sessionStorage.removeItem('sathyadhare:readerMode') } catch {}
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleToggleMenu = () => setIsMenuOpen((prev) => !prev);
    window.addEventListener('toggle-drawer', handleToggleMenu);
    return () => window.removeEventListener('toggle-drawer', handleToggleMenu);
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

  // Handler: enable reader mode and navigate to reader homepage
  function handleSwitchToReader() {
    enableReaderMode();
    router.push('/');
  }

  // Handler: disable reader mode and navigate to their dashboard
  function handleReturnToDashboard() {
    disableReaderMode();
    router.push(dashboardHref);
  }

  // Don't render nav chrome on auth pages
  if (isAuthPage) return null;

  return (
    <>
      {/* ── Reader Mode Banner (only when privileged user is on reader side) ── */}
      {isPrivilegedRole && isOnReaderSide && readerMode && (
        <div
          id="reader-mode-banner"
          className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-3 px-4 py-2 text-xs font-bold"
          style={{
            background: 'linear-gradient(90deg, #7c3aed 0%, #0047ff 100%)',
            color: '#fff',
            paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))',
          }}
        >
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            You are in Reader Mode
          </span>
          <span className="opacity-60 hidden sm:inline">—</span>
          <button
            onClick={handleReturnToDashboard}
            className="underline underline-offset-2 hover:no-underline transition-all"
          >
            🔙 Return to {dashboardLabel}
          </button>
        </div>
      )}

      <header
        className="fixed left-0 right-0 z-50 w-full transition-colors duration-300"
        style={{
          top: (isPrivilegedRole && isOnReaderSide && readerMode) ? 'calc(32px + env(safe-area-inset-top, 0px))' : '0px',
          background: isAdminRoute ? 'var(--color-surface)' : 'var(--color-background)',
          paddingTop: (isPrivilegedRole && isOnReaderSide && readerMode) ? '0px' : 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* ── Main bar ──────────────────────────────────────────────── */}
        <div className={`flex items-center justify-between px-4 sm:px-5 h-14`}>

          {/* Logo */}
          <Link href={isAdminRoute ? dashboardHref : '/'} className="flex items-center flex-shrink-0 tap-highlight">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
              alt="Sathyadhare Logo"
              className="h-[26px] min-w-[110px] object-left object-contain transition-opacity duration-300"
              suppressHydrationWarning
            />
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1">

            {/* ── Switch to Reader Mode button (admin route → reader side) ── */}
            {isPrivilegedRole && isAdminRoute && (
              <button
                id="switch-reader-mode-btn"
                onClick={handleSwitchToReader}
                className="tap-highlight flex items-center gap-1.5 px-3 h-8 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95"
                style={{ background: 'rgba(255,229,0,0.12)', color: '#ffe500', border: '1px solid rgba(255,229,0,0.25)' }}
                title="Switch to Reader Mode"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[14px] h-[14px] flex-shrink-0">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
                <span className="hidden sm:inline">Reader Mode</span>
              </button>
            )}

            {/* ── Return to Dashboard button (reader side, reader mode active) ── */}
            {isPrivilegedRole && isOnReaderSide && readerMode && (
              <button
                id="return-dashboard-btn"
                onClick={handleReturnToDashboard}
                className="tap-highlight flex items-center gap-1.5 px-3 h-8 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95"
                style={{ background: 'rgba(0,71,255,0.15)', color: '#4f8ef7', border: '1px solid rgba(0,71,255,0.3)' }}
                title={`Return to ${dashboardLabel}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] flex-shrink-0">
                  <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
            )}

            {/* ── Passive "Back to Dashboard" link (reader side, reader mode NOT active) ── */}
            {isPrivilegedRole && isOnReaderSide && !readerMode && (
              <Link
                href={dashboardHref}
                className="tap-highlight flex items-center gap-1.5 px-3 h-8 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95"
                style={{ background: 'rgba(0,71,255,0.15)', color: '#4f8ef7', border: '1px solid rgba(0,71,255,0.3)' }}
                title={`Back to ${dashboardLabel}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] flex-shrink-0">
                  <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Admin Dashboard</span>
              </Link>
            )}



            {/* ── Profile / User Icon ─────────────────────────── */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="tap-highlight w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-all active:scale-95"
              title="Profile"
              aria-label="Open profile"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
          </div>
        </div>


        {/* ── Drawer overlay ────────────────────────────────────────── */}
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
                    <Link href="/admin" onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-sm font-semibold text-[var(--color-text)] hover:text-[#ffe500] transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                      Dashboard
                    </Link>
                    <Link href="/admin/articles" onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-sm font-semibold text-[var(--color-text)] hover:text-[#ffe500] transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9" /></svg>
                      Articles
                    </Link>
                    <Link href="/admin/categories" onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-sm font-semibold text-[var(--color-text)] hover:text-[#ffe500] transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                      Categories
                    </Link>
                    <Link href="/admin/users" onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-sm font-semibold text-[var(--color-text)] hover:text-[#ffe500] transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      Users
                    </Link>
                    <Link href="/admin/media" onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-sm font-semibold text-[var(--color-text)] hover:text-[#ffe500] transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Media Library
                    </Link>
                    <Link href="/admin/series" onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-sm font-semibold text-[var(--color-text)] hover:text-[#ffe500] transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      Series
                    </Link>

                    <div className="h-px bg-[var(--color-border)] my-2" />
                    
                    {/* Theme Toggle in Drawer */}
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm font-semibold text-[var(--color-text)]">Theme</span>
                      <ThemeSwitcher />
                    </div>

                    {/* Switch to Reader Mode CTA in drawer */}
                    <button
                      onClick={() => { setIsMenuOpen(false); handleSwitchToReader(); }}
                      className="flex items-center gap-3 py-3 text-sm font-semibold text-[#ffe500] hover:opacity-80 transition-opacity text-left"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                      👁️ Switch to Reader Mode
                    </button>

                    <Link href="/" onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
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
                  /* ─── READER drawer: full content ───────────────── */
                  <div className="px-5 py-6 flex flex-col gap-0">
                    {/* Donate */}
                    <div className="flex justify-center mb-6">
                      <button className="flex items-center gap-2 bg-[#ffe500] text-black px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-sm shadow-md hover:scale-105 active:scale-95 transition-all">
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="black">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                        Donate Now
                      </button>
                    </div>

                    <nav className="flex flex-col">
                      {[
                        { name: 'Editorials',      slug: 'editorials' },
                        { name: 'Education',        slug: 'education' },
                        { name: 'Friday Message',   slug: 'friday-message',   highlight: true },
                        { name: 'Readers Corner',   slug: 'readers-corner',   highlight: true },
                        { name: 'History',          slug: 'history',          highlight: true },
                        { name: 'Literature',       slug: 'literature' },
                        { name: 'Politics',         slug: 'politics' },
                        { name: 'Interview',        slug: 'interview' },
                        { name: 'Religion',         slug: 'religion',         highlight: true },
                        { name: 'Science',          slug: 'science' },
                        { name: 'About Us',         slug: 'about-us' },
                      ].map((item) => (
                        <Link
                          key={item.name}
                          href={item.slug === 'about-us' ? '/about' : `/categories/${item.slug}`}
                          className={`py-3.5 text-[15px] font-semibold border-b border-[var(--color-border)] transition-colors ${
                            item.highlight ? 'text-[#ffe500]' : 'text-[var(--color-text)] hover:text-[var(--color-primary)]'
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}

                      <div className="mt-5 flex flex-col gap-1">
                        {/* Privileged role in reader mode — show return + disable buttons */}
                        {isPrivilegedRole && readerMode && (
                          <>
                            <button
                              onClick={() => { setIsMenuOpen(false); handleReturnToDashboard(); }}
                              className="py-3 text-[13px] font-black text-[#0047ff] dark:text-[#ffe500] uppercase tracking-widest text-left"
                            >
                              🔙 Back to {dashboardLabel}
                            </button>
                          </>
                        )}
                        {/* Privileged role NOT in reader mode — show passive link */}
                        {isPrivilegedRole && !readerMode && (
                          <Link
                            href={dashboardHref}
                            onClick={() => setIsMenuOpen(false)}
                            className="py-3 text-[13px] font-black text-[#0047ff] dark:text-[#ffe500] uppercase tracking-widest"
                          >
                            Back to {dashboardLabel}
                          </Link>
                        )}
                        {clientUser ? (
                          <div className="py-2 mt-2">
                            <div className="text-[10px] uppercase font-bold text-[var(--color-muted)] tracking-widest">Signed in as</div>
                            <div className="text-sm font-bold text-[var(--color-text)] truncate mb-4">{clientUser.email}</div>
                            <Link href="/logout" onClick={() => setIsMenuOpen(false)}
                              className="py-2 inline-block text-[13px] font-bold text-red-500 uppercase tracking-widest">
                              Logout
                            </Link>
                          </div>
                        ) : (
                          <Link href="/login" onClick={() => setIsMenuOpen(false)}
                            className="py-3 text-[13px] font-bold text-[var(--color-text)] uppercase tracking-widest">
                            Login
                          </Link>
                        )}
                        
                        <div className="h-px bg-[var(--color-border)] my-2" />
                        
                        {/* Theme Toggle in Drawer */}
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[13px] font-bold text-[var(--color-text)] uppercase tracking-widest">Theme</span>
                          <ThemeSwitcher />
                        </div>
                      </div>
                    </nav>
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
      </header>
    </>
  );
}
