'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';
import { Sun, Moon, ChevronUp, ChevronDown, Minimize2 } from 'lucide-react';

/* ─── Browser compatibility types ──────────────────────────── */
interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  mozFullScreenEnabled?: boolean;
}
interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
}

/* ─────────────────── Main Component ─────────────────── */
interface ArticleReaderControlsProps {
  role?: string | null;
}

export default function ArticleReaderControls({ }: ArticleReaderControlsProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollPos, setScrollPos] = useState<'top' | 'middle' | 'bottom'>('top');

  /* ── Mount ────────────────────────────────────────── */
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  /* ── Scroll tracking ──────────────────────────────── */
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollY < 80) setScrollPos('top');
      else if (scrollY >= maxScroll - 80) setScrollPos('bottom');
      else setScrollPos('middle');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Fullscreen change events ─────────────────────── */
  useEffect(() => {
    const onFsChange = () => {
      const doc = document as FullscreenDocument;
      const fsEl = document.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement;
      const active = !!fsEl || document.documentElement.classList.contains('is-fullscreen');
      setIsFullscreen(active);
      if (active) {
        document.documentElement.classList.add('is-fullscreen');
      } else {
        document.documentElement.classList.remove('is-fullscreen');
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('mozfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.removeEventListener('mozfullscreenchange', onFsChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const doc = document as FullscreenDocument;
    const el = document.documentElement as FullscreenElement;
    try {
      if (!isFullscreen) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
        document.documentElement.classList.add('is-fullscreen');
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
        else if (doc.mozCancelFullScreen) await doc.mozCancelFullScreen();
        document.documentElement.classList.remove('is-fullscreen');
      }
      setIsFullscreen(!isFullscreen);
    } catch (e) {
      console.warn('Fullscreen error:', e);
      const next = !isFullscreen;
      setIsFullscreen(next);
      if (next) document.documentElement.classList.add('is-fullscreen');
      else document.documentElement.classList.remove('is-fullscreen');
    }
  }, [isFullscreen]);

  /* ── External Fullscreen Trigger ── */
  useEffect(() => {
    const handler = () => { toggleFullscreen(); };
    window.addEventListener('toggle-fullscreen', handler);
    return () => window.removeEventListener('toggle-fullscreen', handler);
  }, [toggleFullscreen]);

  const toggleTheme = useCallback(() => {
    const current = resolvedTheme || theme;
    setTheme(current === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, theme, setTheme]);

  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);
  const scrollToBottom = useCallback(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }), []);

  if (!mounted) return null;

  const isDark = (resolvedTheme || theme) === 'dark';

  const scrollBtnBase =
    'w-11 h-11 flex items-center justify-center rounded-full bg-[var(--color-surface)]/90 backdrop-blur-xl border border-[var(--color-border)] shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 pointer-events-auto text-[var(--color-text)]';

  const controls = (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :fullscreen, ::-webkit-full-screen, :-moz-full-screen {
          background-color: var(--color-background) !important;
        }

        /* === FULLSCREEN HIDES === */
        html.is-fullscreen header,
        html.is-fullscreen nav,
        html.is-fullscreen nav[aria-label="Bottom navigation"],
        html.is-fullscreen .hide-in-fullscreen {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        :fullscreen header,
        :fullscreen nav,
        :-webkit-full-screen header,
        :-webkit-full-screen nav {
          display: none !important;
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        @keyframes scroll-btn-in {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-scroll-btn { animation: scroll-btn-in 0.2s ease-out forwards; }
      `}} />

      {/* ── Fullscreen FLOATING CONTROLS — premium pill at bottom center ── */}
      {isFullscreen && (
        <div
          className="fixed bottom-8 left-1/2 z-[9999] pointer-events-auto animate-fade-up"
          style={{ transform: 'translateX(-50%)' }}
        >
          <div className="flex items-center gap-1 p-1.5 rounded-[3rem] bg-black/75 backdrop-blur-2xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
              title={isDark ? 'Switch to Light' : 'Switch to Dark'}
            >
              {isDark
                ? <Sun className="w-[18px] h-[18px] text-amber-300" strokeWidth={2.5} />
                : <Moon className="w-[18px] h-[18px] text-indigo-300" strokeWidth={2.5} />}
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-white/15 mx-0.5" />

            {/* Exit button */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full text-white text-[11px] font-black uppercase tracking-[0.18em] hover:bg-white/10 active:scale-95 transition-all"
            >
              <Minimize2 className="w-4 h-4" strokeWidth={2.5} />
              Exit
            </button>
          </div>
        </div>
      )}

      {/* ── Scroll Buttons — right side, always above nav bar ── */}
      <div
        className="fixed right-4 z-[90] flex flex-col gap-3 pointer-events-none"
        style={{ bottom: isFullscreen ? '24px' : 'calc(60px + env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        {scrollPos !== 'top' && (
          <button
            onClick={scrollToTop}
            className={`${scrollBtnBase} animate-scroll-btn`}
            title="Scroll to Top"
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
          </button>
        )}
        {scrollPos !== 'bottom' && (
          <button
            onClick={scrollToBottom}
            className={`${scrollBtnBase} animate-scroll-btn`}
            title="Scroll to Bottom"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </>
  );

  return createPortal(controls, document.body);
}

/* ─────────────────── Reader Action Bar — Deprecated ─────────────────── */
export function ReaderActionBar() {
  return null;
}

/* ─────────────────── Copy-Protection Wrapper ─────────────────── */
interface CopyProtectedProps {
  children?: React.ReactNode;
  className?: string;
  html?: string;
}

export function CopyProtected({ children, className = '', html }: CopyProtectedProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prevent = (e: Event) => e.preventDefault();
    el.addEventListener('copy', prevent);
    el.addEventListener('cut', prevent);
    el.addEventListener('contextmenu', prevent);
    return () => {
      el.removeEventListener('copy', prevent);
      el.removeEventListener('cut', prevent);
      el.removeEventListener('contextmenu', prevent);
    };
  }, []);

  if (html) {
    return (
      <div
        ref={ref}
        className={`select-none ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
        aria-label="Article content"
      />
    );
  }

  return (
    <div ref={ref} className={`select-none ${className}`}>
      {children}
    </div>
  );
}
