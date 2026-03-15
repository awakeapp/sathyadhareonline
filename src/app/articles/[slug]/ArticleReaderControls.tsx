'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronUp, ChevronDown, Minimize2,
  Settings, Plus, Minus, 
  List, RotateCcw, Highlighter, Share2, 
  Clipboard, X, Loader2
} from 'lucide-react';
import { toast } from 'sonner';



/* ─────────────────── Main Component ─────────────────── */
interface ArticleReaderControlsProps {
  articleId: string;
  userId?: string | null;
}

export default function ArticleReaderControls({ }: ArticleReaderControlsProps) {
  const [mounted, setMounted] = useState(false);
  const [scrollPos, setScrollPos] = useState<'top' | 'middle' | 'bottom'>('top');
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('kannada-serif');
  const [lineHeight, setLineHeight] = useState(1.85);
  const [showSettings, setShowSettings] = useState(false);
  const [hasTOC, setHasTOC] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
      const savedSize = localStorage.getItem('sathyadhare:font-size');
      if (savedSize) setFontSize(parseInt(savedSize, 10));
      const savedFont = localStorage.getItem('sathyadhare:font-family');
      if (savedFont) setFontFamily(savedFont);
      const savedLine = localStorage.getItem('sathyadhare:line-height');
      if (savedLine) setLineHeight(parseFloat(savedLine));

      const headings = document.querySelectorAll('.prose-article h1, .prose-article h2, .prose-article h3');
      setHasTOC(headings.length >= 2);
    });
  }, []);

  const incFont = () => setFontSize(s => Math.min(s + 2, 32));
  const decFont = () => setFontSize(s => Math.max(s - 2, 12));

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
      
      localStorage.setItem('sathyadhare:line-height', lineHeight.toString());
      document.documentElement.style.setProperty('--article-line-height', lineHeight.toString());
    }
  }, [fontSize, fontFamily, lineHeight, mounted]);



  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollY < 80) setScrollPos('top');
      else if (scrollY >= maxScroll - 80) setScrollPos('bottom');
      else setScrollPos('middle');
      if (maxScroll > 0) setProgress((scrollY / maxScroll) * 100);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);



  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });

  const resetAll = () => {
    setFontSize(18);
    setFontFamily('kannada-serif');
    setLineHeight(1.85);
    toast.success('Defaults restored');
  };

  useEffect(() => {
    if (showSettings && window.innerWidth < 1024) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
  }, [showSettings]);

  if (!mounted) return null;

  const controlBtnBase = 'w-12 h-12 flex items-center justify-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl hover:scale-110 active:scale-95 transition-all pointer-events-auto text-[var(--color-text)]';

  const controls = (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes settings-slide-right { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-settings-slide { animation: settings-slide-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .section-label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.18em; color: var(--color-muted); margin-bottom: 12px; display: block; }
        .prose-article { 
          text-align: var(--article-text-align, left) !important;
        }
        .prose-article p { 
          text-align: var(--article-text-align, left) !important;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .overscroll-contain { overscroll-behavior: contain; }
      `}} />

      {showSettings && (
        <div className="fixed inset-0 z-[1100]" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in pointer-events-auto" onClick={() => setShowSettings(false)} />
          <div 
            className="absolute right-0 bottom-0 w-[min(340px,100vw)] bg-[var(--color-surface)] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pointer-events-auto overflow-hidden flex flex-col animate-settings-slide border-l border-[var(--color-border)] rounded-tl-[2.5rem]"
            style={{ top: 'max(72px, calc(64px + env(safe-area-inset-top, 0px)))' }}
          >
            {/* Minimal Header */}
            <div className="flex items-center justify-between px-7 pt-7 pb-4">
              <div>
                <h2 className="text-[17px] font-black text-[var(--color-text)] tracking-tight">Appearance</h2>
                <div className="w-8 h-1 bg-[var(--color-primary)] rounded-full mt-1.5 opacity-80" />
              </div>
              <button 
                onClick={() => setShowSettings(false)} 
                className="w-10 h-10 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] transition-all active:scale-90"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="flex-1 px-7 py-6 space-y-9 overflow-y-auto hide-scrollbar overscroll-contain">
              
              {/* 1. Change Font */}
              <div className="space-y-3">
                <span className="section-label !mb-0">Selected Font</span>
                <div className="relative group">
                  <select 
                    value={fontFamily} 
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full bg-[var(--color-surface-2)] border-2 border-transparent rounded-[1.25rem] px-5 py-4 text-[15px] font-bold text-[var(--color-text)] outline-none focus:bg-[var(--color-surface)] focus:border-[var(--color-primary)] transition-all appearance-none cursor-pointer pr-12 shadow-sm"
                  >
                    <option value="kannada-serif">Classic Serif</option>
                    <option value="kannada-sans">Modern Sans</option>
                    <option value="kannada-tiro">Literary Serif</option>
                    <option value="kannada-modern">Display Sans</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition-colors">
                    <ChevronDown size={18} strokeWidth={3} />
                  </div>
                </div>
              </div>

              {/* 2. Font Size */}
              <div className="space-y-3">
                <div className="flex items-center justify-between section-label !mb-0">
                  <span>Font Size</span>
                  <span className="text-[var(--color-primary)] lowercase tracking-normal">{fontSize}px</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={decFont} 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm active:scale-90 border border-[var(--color-border)]"
                  >
                    <Minus size={20} strokeWidth={2.5} />
                  </button>
                  <div className="flex-1 h-3 bg-[var(--color-surface-2)] rounded-full relative overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-[var(--color-primary)] transition-all duration-300"
                      style={{ width: `${((fontSize - 12) / (32 - 12)) * 100}%` }}
                    />
                  </div>
                  <button 
                    onClick={incFont} 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm active:scale-90 border border-[var(--color-border)]"
                  >
                    <Plus size={20} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* 3. Spacing */}
              <div className="space-y-4">
                <span className="section-label !mb-0">Line Spacing</span>
                <div className="flex bg-[var(--color-surface-2)] p-1.5 rounded-[1.25rem] border border-[var(--color-border)] shadow-inner">
                  {[
                    { val: 1.4, label: 'Tight' },
                    { val: 1.85, label: 'Normal' },
                    { val: 2.3, label: 'Large' }
                  ].map(lh => (
                    <button 
                      key={lh.val} 
                      onClick={() => setLineHeight(lh.val)} 
                      className={`flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${lineHeight === lh.val ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
                    >
                      {lh.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-Actions */}
              <div className="pt-6">
                <button 
                  onClick={resetAll} 
                  className="w-full h-12 rounded-2xl text-[10px] font-black text-[var(--color-muted)] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:text-rose-500 hover:bg-rose-500/5 transition-all active:scale-[0.98]"
                >
                  <RotateCcw size={14} strokeWidth={3} />
                  Restore Defaults
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Buttons */}
      <div className="fixed right-6 z-[95] flex flex-col gap-4 pointer-events-none transition-all duration-700" style={{ bottom: 'calc(90px + env(safe-area-inset-bottom, 0px))' }}>
        <button onClick={() => setShowSettings(!showSettings)} className={`${controlBtnBase} pointer-events-auto ${showSettings ? 'scale-110 border-[var(--color-primary)] ring-8 ring-[var(--color-primary)]/10 text-[var(--color-primary)]' : ''}`}><Settings className={showSettings ? 'rotate-90' : ''}/></button>
        {hasTOC && (
          <button onClick={() => window.dispatchEvent(new CustomEvent('toggle-toc'))} className={`${controlBtnBase} !rounded-full relative group pointer-events-auto`}>
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21.5" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="135" strokeDashoffset={135 - (135 * progress) / 100} className="text-[var(--color-primary)] transition-all"/></svg>
            <List size={20} className="relative z-10"/>
          </button>
        )}
        <div className="flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl pointer-events-auto overflow-hidden">
          <button onClick={scrollToTop} className={`w-12 h-12 flex items-center justify-center hover:bg-[var(--color-surface-2)] transition-all ${scrollPos === 'top' ? 'h-0 opacity-0' : 'h-12 opacity-100'}`}><ChevronUp size={20}/></button>
          <div className={`h-px bg-[var(--color-border)] mx-3 transition-opacity ${scrollPos === 'top' || scrollPos === 'middle' ? 'opacity-100' : 'opacity-0'}`} />
          <button onClick={scrollToBottom} className={`w-12 h-12 flex items-center justify-center hover:bg-[var(--color-surface-2)] transition-all ${scrollPos === 'bottom' ? 'h-0 opacity-0' : 'h-12 opacity-100'}`}><ChevronDown size={20}/></button>
        </div>
      </div>
    </>
  );

  return createPortal(controls, document.body);
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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.toString().trim() === '' || !el.contains(sel.anchorNode)) { setSelection(null); return; }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setSelection({ text: sel.toString().trim(), x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 10 });
    };
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const saveHighlight = async () => {
    if (!userId || !articleId || !selection) { if (!userId) toast.error("Sign in to save highlights"); return; }
    setIsSaving(true);
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { error } = await supabase.from('article_highlights').insert({ user_id: userId, article_id: articleId, content: selection.text });
      if (error) throw error;
      toast.success("Highlight saved");
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    } catch { toast.error("Failed to save highlight"); }
    finally { setIsSaving(false); }
  };

  const copyToClipboard = () => {
    if (!selection) return;
    navigator.clipboard.writeText(selection.text);
    toast.success("Copied");
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const shareText = () => {
    if (!selection) return;
    window.open(`whatsapp://send?text=${encodeURIComponent(`"${selection.text}" — ${window.location.href}`)}`, '_blank');
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const preventCopy = (e: Event) => { e.preventDefault(); toast.error("Copying is disabled."); };
    el.addEventListener('copy', preventCopy); el.addEventListener('cut', preventCopy); el.addEventListener('contextmenu', e => e.preventDefault());
    const imgs = el.querySelectorAll('img');
    const hImg = (e: Event) => setZoomImg((e.currentTarget as HTMLImageElement).src);
    imgs.forEach(img => { 
      img.style.cursor = 'zoom-in'; 
      img.addEventListener('click', hImg); 
    });
    return () => { 
      el.removeEventListener('copy', preventCopy); 
      el.removeEventListener('cut', preventCopy); 
      imgs.forEach(img => img.removeEventListener('click', hImg)); 
    };
  }, [html]);

  return (
    <>
      {html ? <div ref={ref} className={`select-none ${className}`} dangerouslySetInnerHTML={{ __html: html }} /> : <div ref={ref} className={`select-none ${className}`}>{children}</div>}
      {selection && (
        <div className="fixed z-[999] -translate-x-1/2 -translate-y-full flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/90 text-white shadow-2xl animate-fade-in" style={{ left: selection.x, top: selection.y - 12 }}>
          <button onClick={saveHighlight} disabled={isSaving} className="w-10 h-10 flex flex-col items-center justify-center rounded-xl hover:bg-white/10">{isSaving ? <Loader2 size={16} className="animate-spin"/> : <div className="flex flex-col items-center justify-center"><Highlighter size={16} className="text-amber-400"/><span className="text-[7px] font-black uppercase mt-0.5">Save</span></div>}</button>
          <button onClick={copyToClipboard} className="w-10 h-10 flex flex-col items-center justify-center rounded-xl hover:bg-white/10"><Clipboard size={16}/><span className="text-[7px] font-black uppercase mt-0.5">Copy</span></button>
          <button onClick={shareText} className="w-10 h-10 flex flex-col items-center justify-center rounded-xl hover:bg-white/10"><Share2 size={16} className="text-emerald-400"/><span className="text-[7px] font-black uppercase mt-0.5">Share</span></button>
        </div>
      )}
      {zoomImg && (
        <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomImg(null)}>
          <button className="absolute top-6 right-6 text-white"><Minimize2 size={32}/></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomImg} alt="Zoomed" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-in" />
        </div>
      )}
    </>
  );
}
