'use client';
export const runtime = 'edge';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';
import { 
  Sun, Moon, ChevronUp, ChevronDown, Minimize2, 
  Settings, Plus, Minus, Coffee, Maximize, 
  AlignLeft, List, RotateCcw, Highlighter, Share2, 
  Clipboard, Eye, EyeOff, X, Layout
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import TextToSpeech from '@/components/TextToSpeech';

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
  articleId: string;
  userId?: string | null;
  contentHtml?: string;
  title?: string;
}

export default function ArticleReaderControls({ articleId, userId, contentHtml, title }: ArticleReaderControlsProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollPos, setScrollPos] = useState<'top' | 'middle' | 'bottom'>('top');
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('kannada-serif');
  const [columnWidth, setColumnWidth] = useState('medium');
  const [lineHeight, setLineHeight] = useState(1.85);
  const [showSettings, setShowSettings] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [hasTOC, setHasTOC] = useState(false);
  const [progress, setProgress] = useState(0);
  const supabase = createClient();

  /* ── Mount ────────────────────────────────────────── */
  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
      const savedSize = localStorage.getItem('sathyadhare:font-size');
      if (savedSize) setFontSize(parseInt(savedSize, 10));

      const savedFont = localStorage.getItem('sathyadhare:font-family');
      if (savedFont) setFontFamily(savedFont);

      const savedWidth = localStorage.getItem('sathyadhare:column-width');
      if (savedWidth) setColumnWidth(savedWidth);

      const savedLine = localStorage.getItem('sathyadhare:line-height');
      if (savedLine) setLineHeight(parseFloat(savedLine));

      const headings = document.querySelectorAll('.prose-article h1, .prose-article h2, .prose-article h3');
      setHasTOC(headings.length >= 2);
    });
  }, []);

  const incFont = () => setFontSize(s => Math.min(s + 1, 32));
  const decFont = () => setFontSize(s => Math.max(s - 1, 12));

  /* ── Highlights tracking ─────────────────────────────────── */
  useEffect(() => {
    if (userId && articleId) {
      supabase
        .from('article_highlights')
        .select('id', { count: 'exact', head: true })
        .eq('article_id', articleId)
        .eq('user_id', userId);
    }
  }, [userId, articleId, supabase]);

  /* ── Persistence ────────────────────────────────── */
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sathyadhare:font-size', fontSize.toString());
      document.documentElement.style.setProperty('--article-font-size', `${fontSize}px`);

      localStorage.setItem('sathyadhare:font-family', fontFamily);
      const fontVal = fontFamily === 'kannada-serif' ? 'var(--font-noto-serif-kannada), serif' :
                     fontFamily === 'kannada-sans' ? 'var(--font-noto-sans-kannada), sans-serif' :
                     fontFamily === 'kannada-tiro' ? 'var(--font-tiro-kannada), serif' :
                     'var(--font-baloo-tamma), sans-serif';
      document.documentElement.style.setProperty('--article-font-family', fontVal);

      localStorage.setItem('sathyadhare:column-width', columnWidth);
      const widthVal = columnWidth === 'narrow' ? '640px' : 
                      columnWidth === 'wide' ? '1200px' : '880px';
      document.documentElement.style.setProperty('--article-max-width', widthVal);

      localStorage.setItem('sathyadhare:line-height', lineHeight.toString());
      document.documentElement.style.setProperty('--article-line-height', lineHeight.toString());
    }
  }, [fontSize, fontFamily, columnWidth, lineHeight, mounted]);

  useEffect(() => {
    if (isFocusMode) {
      document.documentElement.classList.add('focus-mode');
    } else {
      document.documentElement.classList.remove('focus-mode');
    }
  }, [isFocusMode]);

  /* ── Scroll tracking ──────────────────────────────── */
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      if (scrollY < 80) setScrollPos('top');
      else if (scrollY >= maxScroll - 80) setScrollPos('bottom');
      else setScrollPos('middle');
      
      if (maxScroll > 0) {
        setProgress((scrollY / maxScroll) * 100);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Fullscreen ────────────────────────────────── */
  useEffect(() => {
    const onFsChange = () => {
      const doc = document as FullscreenDocument;
      const fsEl = document.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement;
      setIsFullscreen(!!fsEl);
      if (fsEl) document.documentElement.classList.add('is-fullscreen');
      else document.documentElement.classList.remove('is-fullscreen');
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
    if (!isFullscreen) {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    }
  }, [isFullscreen]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });

  // Body lock for settings
  useEffect(() => {
    if (showSettings && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [showSettings]);

  if (!mounted) return null;


  const controlBtnBase =
    'w-12 h-12 flex items-center justify-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:scale-110 active:scale-95 transition-all duration-300 pointer-events-auto text-[var(--color-text)]';

  const controls = (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes settings-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .animate-settings-slide { animation: settings-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes bottom-drawer-in {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .animate-bottom-drawer { animation: bottom-drawer-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .animate-pulse-soft { animation: pulse-soft 3s infinite ease-in-out; }
      `}} />

      {/* ── Settings Panel (always right-half panel) ── */}
      {showSettings && (
        <div className="fixed inset-0 z-[1100] pointer-events-none">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fade-in pointer-events-auto"
            onClick={() => setShowSettings(false)}
          />

          {/* Right-side sliding panel — max 50vw on desktop, 90vw on mobile */}
          <div className="absolute top-0 right-0 h-full w-[min(520px,90vw)] bg-[var(--color-surface)] shadow-[-24px_0_80px_rgba(0,0,0,0.25)] pointer-events-auto overflow-y-auto flex flex-col animate-settings-slide">

            {/* Header bar */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] shrink-0">
              <div>
                <h2 className="text-xl font-black tracking-tight">Reading Settings</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-primary)] mt-0.5">Customize your experience</p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] hover:text-rose-500 hover:rotate-90 transition-all duration-200"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

              {/* 1. Theme */}
              <div>
                <p className="section-label">Appearance</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'light', icon: Sun, label: 'Light', color: 'bg-white text-zinc-900 border-zinc-200' },
                    { id: 'sepia', icon: Coffee, label: 'Sepia', color: 'bg-[#f4ecd8] text-orange-900 border-[#d4b896]' },
                    { id: 'dark', icon: Moon, label: 'Dark', color: 'bg-[#0b141a] text-zinc-100 border-[#222e35]' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`relative flex flex-col items-center gap-2 p-1 rounded-2xl transition-all ${
                        theme === t.id ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-surface)]' : 'opacity-50 hover:opacity-90'
                      }`}
                    >
                      <div className={`w-full aspect-[4/3] rounded-xl flex items-center justify-center border-2 ${t.color}`}>
                        <t.icon size={22} strokeWidth={2.5} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Font Size + Width in a row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="section-label">Font Size</p>
                  <div className="flex items-center justify-between bg-[var(--color-surface-2)] rounded-xl p-1.5 border border-[var(--color-border)]">
                    <button onClick={decFont} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-muted)] transition-colors">
                      <Minus size={16} strokeWidth={3} />
                    </button>
                    <span className="text-base font-black">{fontSize}</span>
                    <button onClick={incFont} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-muted)] transition-colors">
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="section-label">Width</p>
                  <div className="flex gap-1.5 bg-[var(--color-surface-2)] p-1.5 rounded-xl border border-[var(--color-border)]">
                    {[
                      { id: 'narrow', icon: AlignLeft, label: 'S' },
                      { id: 'medium', icon: Layout, label: 'M' },
                      { id: 'wide', icon: Maximize, label: 'L' }
                    ].map(w => (
                      <button
                        key={w.id}
                        onClick={() => setColumnWidth(w.id)}
                        className={`flex-1 h-9 flex flex-col items-center justify-center rounded-lg text-[8px] font-black uppercase transition-all ${
                          columnWidth === w.id ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--color-muted)] hover:bg-[var(--color-surface)]'
                        }`}
                      >
                        <w.icon size={13} strokeWidth={2.5} />
                        <span className="mt-0.5">{w.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Script */}
              <div>
                <p className="section-label">Kannada Typography</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'kannada-serif', label: 'Daily Serif', fontClass: 'font-kannada-serif' },
                    { id: 'kannada-tiro', label: 'Classic Tiro', fontClass: 'font-tiro-kannada' },
                    { id: 'kannada-sans', label: 'Modern Sans', fontClass: 'font-kannada-sans' },
                    { id: 'kannada-modern', label: 'Soft Round', fontClass: 'font-kannada-modern' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFontFamily(f.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                        fontFamily === f.id
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                          : 'border-[var(--color-border)] opacity-60 hover:opacity-100 hover:border-[var(--color-muted)]'
                      }`}
                    >
                      <span className={`text-xl font-black ${f.fontClass}`}>ಅ</span>
                      <span className="text-[10px] font-black uppercase tracking-wide">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Audio */}
              {contentHtml && (
                <div>
                  <p className="section-label">Listen to Article</p>
                  <TextToSpeech text={contentHtml} title={title} />
                </div>
              )}

              {/* 5. Modes */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    isFocusMode
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-lg'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40'
                  }`}
                >
                  {isFocusMode ? <EyeOff size={18} /> : <Eye size={18} className="text-[var(--color-primary)]" />}
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-wider">Focus</p>
                    <p className={`text-[8px] font-bold uppercase ${ isFocusMode ? 'text-white/70' : 'text-[var(--color-muted)]'}`}>{isFocusMode ? 'On' : 'Off'}</p>
                  </div>
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-3 p-4 rounded-xl border-2 border-[var(--color-border)] hover:border-[var(--color-primary)]/40 transition-all"
                >
                  <Maximize size={18} className="text-[var(--color-primary)]" />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-wider">Cinema</p>
                    <p className="text-[8px] font-bold uppercase text-[var(--color-muted)]">Fullscreen</p>
                  </div>
                </button>
              </div>

              {/* 6. Reset */}
              <button
                onClick={() => {
                  setFontSize(18); setColumnWidth('medium'); setTheme('light');
                  setFontFamily('kannada-serif'); setIsFocusMode(false);
                  toast.success('Settings reset to defaults');
                }}
                className="w-full h-11 rounded-xl border-2 border-dashed border-rose-300/60 text-[9px] font-black uppercase tracking-[0.2em] text-rose-400 flex items-center justify-center gap-3 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
              >
                <RotateCcw size={13} />
                Reset all preferences
              </button>

            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `.section-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.18em; color: var(--color-muted); margin-bottom: 10px; }` }} />

      {/* ── STACKED FLOATING CONTROLS (Opaque & Clean) ── */}
      <div 
        className="fixed right-6 z-[95] flex flex-col gap-3 pointer-events-none transition-all duration-700"
        style={{ bottom: isFullscreen ? '40px' : 'calc(90px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex flex-col gap-2.5">
          {/* Settings Trigger */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`${controlBtnBase} !bg-[var(--color-surface)] !border-2 pointer-events-auto ${showSettings ? 'scale-110 border-[var(--color-primary)] ring-[10px] ring-[var(--color-primary)]/10 text-[var(--color-primary)]' : ''} shadow-2xl`}
          >
            <Settings className={`w-5.5 h-5.5 ${showSettings ? 'rotate-90' : ''} transition-transform duration-700`} strokeWidth={2.5} />
          </button>

          {/* TOC Trigger with Progress Circular Track */}
          {hasTOC && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-toc'))}
              className={`${controlBtnBase} !bg-[var(--color-surface)] !border-2 !rounded-full pointer-events-auto relative overflow-hidden group shadow-2xl`}
              title="Article Index"
            >
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="21.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="135"
                  strokeDashoffset={135 - (135 * progress) / 100}
                  className="text-[var(--color-primary)] transition-all duration-300"
                />
              </svg>
              <List size={22} strokeWidth={3} className="relative z-10 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Scroll Nav (Solid & Merged) */}
        <div className="flex flex-col bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-[1.5rem] shadow-2xl pointer-events-auto opacity-100 transition-all overflow-hidden">
          <button 
            onClick={scrollToTop} 
            className={`w-12 h-12 flex items-center justify-center hover:bg-[var(--color-surface-2)] transition-all duration-500 ${scrollPos === 'top' ? 'h-0 opacity-0 pointer-events-none' : 'h-12 opacity-100'}`}
          >
            <ChevronUp size={22} strokeWidth={3} />
          </button>
          <div className={`h-px bg-[var(--color-border)] mx-3 transition-all duration-500 ${(scrollPos === 'top' || scrollPos === 'bottom') ? 'opacity-0 h-0 my-0' : 'opacity-100 h-px'}`} />
          <button 
            onClick={scrollToBottom} 
            className={`w-12 h-12 flex items-center justify-center hover:bg-[var(--color-surface-2)] transition-all duration-500 ${scrollPos === 'bottom' ? 'h-0 opacity-0 pointer-events-none' : 'h-12 opacity-100'}`}
          >
            <ChevronDown size={22} strokeWidth={3} />
          </button>
        </div>
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
  articleId?: string;
  userId?: string | null;
}

export function CopyProtected({ children, className = '', html, articleId, userId }: CopyProtectedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.toString().trim() === '') {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      if (!el.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }

      setSelection({
        text: sel.toString().trim(),
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 10
      });
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const saveHighlight = async () => {
    if (!userId || !articleId || !selection) {
      if (!userId) toast.error("Sign in to save highlights");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('article_highlights')
        .insert({ user_id: userId, article_id: articleId, content: selection.text });

      if (error) throw error;
      toast.success("Highlight saved");
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save highlight");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    if (!selection) return;
    navigator.clipboard.writeText(selection.text);
    toast.success("Copied to clipboard");
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const shareText = () => {
    if (!selection) return;
    const text = `"${selection.text}" — Read more on Sathyadhare: ${window.location.origin}${window.location.pathname}`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const preventCopy = (e: Event) => {
      e.preventDefault();
      toast.error("Copying is disabled to protect content.", {
        description: "Please share the article link instead.",
        icon: <Eye className="w-4 h-4 text-rose-500" />,
      });
    };

    const preventMenu = (e: Event) => {
      e.preventDefault();
      // No toast for right-click as it's too intrusive, but kept prevent.
    };

    el.addEventListener('copy', preventCopy);
    el.addEventListener('cut', preventCopy);
    el.addEventListener('contextmenu', preventMenu);

    const generateId = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 50);

    const headings = el.querySelectorAll('h1, h2, h3, h4');
    headings.forEach((h) => {
      const id = h.id || generateId(h.textContent || '');
      if (id && !h.querySelector('.anchor-link')) {
        h.id = id;
        const anchor = document.createElement('a');
        anchor.href = `#${id}`;
        anchor.className = 'anchor-link ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-primary)] no-underline';
        anchor.innerHTML = '#';
        anchor.onclick = (e) => {
          e.preventDefault();
          const url = new URL(window.location.href);
          url.hash = id;
          navigator.clipboard.writeText(url.toString());
          anchor.innerHTML = '✓';
          setTimeout(() => { anchor.innerHTML = '#'; }, 2000);
        };
        h.classList.add('group', 'relative');
        h.appendChild(anchor);
      }
    });

    const imgs = el.querySelectorAll('img');
    const handleImgClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLImageElement;
      setZoomImg(target.src);
    };
    imgs.forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', handleImgClick as EventListener);
    });

    return () => {
      el.removeEventListener('copy', preventCopy);
      el.removeEventListener('cut', preventCopy);
      el.removeEventListener('contextmenu', preventMenu);
      imgs.forEach(img => img.removeEventListener('click', handleImgClick as EventListener));
    };
  }, [html]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .prose-article h1.group, .prose-article h2.group, .prose-article h3.group, .prose-article h4.group {
          display: flex;
          align-items: center;
        }
      `}} />
      {html ? (
        <div
          ref={ref}
          className={`select-none ${className}`}
          dangerouslySetInnerHTML={{ __html: html }}
          aria-label="Article content"
        />
      ) : (
        <div ref={ref} className={`select-none ${className}`}>
          {children}
        </div>
      )}

      {selection && (
        <div 
          className="fixed z-[999] -translate-x-1/2 -translate-y-full flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/90 text-white shadow-2xl border border-white/10 animate-fade-up pointer-events-auto"
          style={{ left: selection.x, top: selection.y - 12 }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button 
            onClick={saveHighlight}
            disabled={isSaving}
            className="w-10 h-10 flex flex-col items-center justify-center rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <Highlighter className={`w-4 h-4 text-amber-400 ${isSaving ? 'animate-pulse' : ''}`} />
            <span className="text-[7px] font-black uppercase mt-0.5">Save</span>
          </button>
          <div className="w-px h-6 bg-white/10" />
          <button 
            onClick={copyToClipboard}
            className="w-10 h-10 flex flex-col items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
          >
            <Clipboard className="w-4 h-4" />
            <span className="text-[7px] font-black uppercase mt-0.5">Copy</span>
          </button>
          <button 
            onClick={shareText}
            className="w-10 h-10 flex flex-col items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[7px] font-black uppercase mt-0.5">Share</span>
          </button>
        </div>
      )}

      {zoomImg && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10 animate-fade-in cursor-zoom-out"
          onClick={() => setZoomImg(null)}
        >
          <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
            <Minimize2 className="w-8 h-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomImg} alt="Zoomed" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-in" />
        </div>
      )}
    </>
  );
}
