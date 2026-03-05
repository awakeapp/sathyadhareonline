'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';


interface TopHeaderProps {
  user: User | null;
  role?: string | null;
}

export default function TopHeader({ user, role }: TopHeaderProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isAdmin  = pathname.startsWith('/admin') || pathname.startsWith('/editor');
  const isReaderMode = pathname.startsWith('/app');
  const isPrivilegedRole = role === 'super_admin' || role === 'admin' || role === 'editor';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply class on mount and whenever theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Don't render nav chrome on auth pages
  if (isAuthPage) return null;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 w-full transition-colors duration-300"
      style={{
        background: isAdmin ? 'var(--color-surface)' : 'var(--color-background)',
        /* Sit flush below the system status bar */
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* ── Main bar ──────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-4 sm:px-5 ${isAdmin ? 'h-14' : 'h-14'}`}>

        {/* Logo */}
        <Link href={isAdmin ? '/admin' : '/'} className="flex items-center flex-shrink-0 tap-highlight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theme === 'dark' ? '/logo-light.png' : '/logo-dark.png'}
            alt="Sathyadhare Logo"
            className="h-[26px] min-w-[110px] object-left object-contain transition-opacity duration-300"
            suppressHydrationWarning
          />
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-1">

          {/* ── Reader Mode / Return to Dashboard button ─────── */}
          {isPrivilegedRole && isAdmin && (
            <Link
              href="/app"
              className="tap-highlight flex items-center gap-1.5 px-3 h-8 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95"
              style={{ background: 'rgba(255,229,0,0.12)', color: '#ffe500', border: '1px solid rgba(255,229,0,0.25)' }}
              title="Reader Mode"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[14px] h-[14px] flex-shrink-0">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              <span className="hidden sm:inline">Reader Mode</span>
            </Link>
          )}
          {isPrivilegedRole && isReaderMode && (
            <Link
              href={
                role === 'super_admin' || role === 'admin' ? '/admin' :
                role === 'editor' ? '/editor' : '/app'
              }
              className="tap-highlight flex items-center gap-1.5 px-3 h-8 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95"
              style={{ background: 'rgba(0,71,255,0.15)', color: '#4f8ef7', border: '1px solid rgba(0,71,255,0.3)' }}
              title="Return to Dashboard"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] flex-shrink-0">
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="tap-highlight w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-all active:scale-95"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* ── 3-bar hamburger "More" ─────────────────────────── */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="tap-highlight w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-all active:scale-95"
            title="Menu"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-[20px] h-[20px]">
              <line x1="3" y1="6"  x2="21" y2="6"  />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>


      {/* Category pills removed — browse via navigation only */}

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
                src={theme === 'dark' ? '/logo-light.png' : '/logo-dark.png'}
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
              {isAdmin ? (
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
                      {/* Privileged role — link to their dashboard */}
                      {(role === 'admin' || role === 'super_admin') && (
                        <Link href="/admin" onClick={() => setIsMenuOpen(false)}
                          className="py-3 text-[13px] font-black text-[#0047ff] dark:text-[#ffe500] uppercase tracking-widest">
                          Admin Panel
                        </Link>
                      )}
                      {role === 'editor' && (
                        <Link href="/editor" onClick={() => setIsMenuOpen(false)}
                          className="py-3 text-[13px] font-black text-[#0047ff] dark:text-[#ffe500] uppercase tracking-widest">
                          Editor Dashboard
                        </Link>
                      )}
                      {user ? (
                        <Link href="/logout" onClick={() => setIsMenuOpen(false)}
                          className="py-3 text-[13px] font-bold text-red-400 uppercase tracking-widest">
                          Logout
                        </Link>
                      ) : (
                        <Link href="/login" onClick={() => setIsMenuOpen(false)}
                          className="py-3 text-[13px] font-bold text-[var(--color-text)] uppercase tracking-widest">
                          Login
                        </Link>
                      )}
                    </div>
                  </nav>
                </div>
              )}
            </div>

            {/* Footer — readers only */}
            {!isAdmin && (
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
  );
}
