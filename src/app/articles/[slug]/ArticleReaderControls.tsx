'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronUp, ChevronDown, Minimize2, 
  Settings, Plus, Minus, Maximize, 
  List, RotateCcw, Highlighter, Share2, 
  Clipboard, Eye, EyeOff, X, Loader2,
  AlignCenter, AlignLeft, AlignJustify,
  Type
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Browser compatibility types ──────────────────────────── */
interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
}
interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
}

/* ─────────────────── Main Component ─────────────────── */
interface ArticleReaderControlsProps {
  articleId: string;
  userId?: string | null;
}

export default function ArticleReaderControls({ articleId, userId }: ArticleReaderControlsProps) {
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollPos, setScrollPos] = useState<'top' | 'middle' | 'bottom'>('top');
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('kannada-serif');
  const [columnWidth, setColumnWidth] = useState('medium');
  const [lineHeight, setLineHeight] = useState(1.85);
  const [textAlign, setTextAlign] = useState<'left' | 'justify'>('left');
  const [showSettings, setShowSettings] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [hasTOC, setHasTOC] = useState(false);
  const [progress, setProgress] = useState(0);

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
      const savedAlign = localStorage.getItem('sathyadhare:text-align');
      if (savedAlign === 'left' || savedAlign === 'justify') setTextAlign(savedAlign);

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
      
      localStorage.setItem('sathyadhare:column-width', columnWidth);
      const widthVal = columnWidth === 'narrow' ? '620px' : columnWidth === 'wide' ? '1100px' : '860px';
      document.documentElement.style.setProperty('--article-max-width', widthVal);
      
      localStorage.setItem('sathyadhare:line-height', lineHeight.toString());
      document.documentElement.style.setProperty('--article-line-height', lineHeight.toString());

      localStorage.setItem('sathyadhare:text-align', textAlign);
      document.documentElement.style.setProperty('--article-text-align', textAlign);
    }
  }, [fontSize, fontFamily, columnWidth, lineHeight, textAlign, mounted]);

  useEffect(() => {
    if (isFocusMode) document.documentElement.classList.add('focus-mode');
    else document.documentElement.classList.remove('focus-mode');
  }, [isFocusMode]);

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

  const resetAll = () => {
    setFontSize(18);
    setColumnWidth('medium');
    setFontFamily('kannada-serif');
    setLineHeight(1.85);
    setTextAlign('left');
    setIsFocusMode(false);
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
      `}} />

      {showSettings && (
        <div className="fixed inset-0 z-[1100] pointer-events-none">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fade-in pointer-events-auto" onClick={() => setShowSettings(false)} />
          <div className="absolute top-14 right-0 bottom-0 w-[min(420px,90vw)] bg-[var(--color-surface)] shadow-2xl pointer-events-auto overflow-y-auto flex flex-col animate-settings-slide border-l border-[var(--color-border)]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-black">Reader Settings</h2>
                <p className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider mt-0.5">Customize your view</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-9 h-9 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] hover:text-rose-500 hover:rotate-90 transition-all"><X size={18} /></button>
            </div>
            
            <div className="flex-1 px-6 py-8 space-y-10 overflow-y-auto">
              
              {/* Text Size & Appearance */}
              <div className="space-y-6">
                <div>
                  <span className="section-label">Typography</span>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'kannada-serif', label: 'Classic Serif', sub: 'Traditional look' },
                      { id: 'kannada-sans', label: 'Modern Sans', sub: 'Clean & minimal' },
                      { id: 'kannada-tiro', label: 'Literary Serif', sub: 'Book style' },
                      { id: 'kannada-modern', label: 'Display Sans', sub: 'Friendly curves' }
                    ].map(f => (
                      <button 
                        key={f.id} 
                        onClick={() => setFontFamily(f.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${fontFamily === f.id ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]' : 'border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'}`}
                      >
                        <div className="text-left">
                          <p className={`text-sm font-bold ${fontFamily === f.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>{f.label}</p>
                          <p className="text-[10px] text-[var(--color-muted)] font-medium">{f.sub}</p>
                        </div>
                        <Type size={18} className={fontFamily === f.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="section-label">Size</span>
                    <div className="flex items-center justify-between bg-[var(--color-surface-2)] p-2 rounded-2xl border border-[var(--color-border)]">
                      <button onClick={decFont} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white hover:text-[var(--color-primary)] transition-all shadow-sm"><Minus size={16}/></button>
                      <span className="text-base font-black text-[var(--color-text)]">{fontSize}</span>
                      <button onClick={incFont} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white hover:text-[var(--color-primary)] transition-all shadow-sm"><Plus size={16}/></button>
                    </div>
                  </div>
                  <div>
                    <span className="section-label">Spacing</span>
                    <div className="flex gap-1.5 bg-[var(--color-surface-2)] p-1.5 rounded-2xl border border-[var(--color-border)]">
                      {[1.4, 1.85, 2.3].map(lh => (
                        <button 
                          key={lh} 
                          onClick={() => setLineHeight(lh)} 
                          className={`flex-1 h-9 rounded-xl text-[10px] font-black transition-all ${lineHeight === lh ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
                        >
                          {lh === 1.4 ? 'COMP' : lh === 1.85 ? 'NORM' : 'WIDE'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="section-label">Alignment</span>
                    <div className="flex gap-1.5 bg-[var(--color-surface-2)] p-1.5 rounded-2xl border border-[var(--color-border)]">
                      {[
                        { id: 'left', icon: AlignLeft },
                        { id: 'justify', icon: AlignJustify }
                      ].map(a => (
                        <button 
                          key={a.id} 
                          onClick={() => setTextAlign(a.id as any)} 
                          className={`flex-1 h-9 rounded-xl flex items-center justify-center transition-all ${textAlign === a.id ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
                        >
                          <a.icon size={18} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="section-label">Width</span>
                    <div className="flex gap-1.5 bg-[var(--color-surface-2)] p-1.5 rounded-2xl border border-[var(--color-border)]">
                      {['narrow', 'medium', 'wide'].map(w => (
                        <button 
                          key={w} 
                          onClick={() => setColumnWidth(w)} 
                          className={`flex-1 h-9 rounded-xl text-[10px] font-black uppercase transition-all ${columnWidth === w ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
                        >
                          {w[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode Tools */}
              <div>
                <span className="section-label">Display</span>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setIsFocusMode(!isFocusMode)} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${isFocusMode ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg' : 'border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'}`}>
                    {isFocusMode ? <EyeOff size={18}/> : <Eye size={18} className="text-indigo-500"/>}
                    <div className="text-left">
                      <p className="text-[11px] font-black uppercase">Focus</p>
                      <p className="text-[8px] opacity-70 font-bold uppercase">{isFocusMode ? 'ON' : 'OFF'}</p>
                    </div>
                  </button>
                  <button onClick={toggleFullscreen} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${isFullscreen ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'}`}>
                    {isFullscreen ? <Minimize2 size={18}/> : <Maximize size={18} className="text-emerald-500"/>}
                    <div className="text-left">
                      <p className="text-[11px] font-black uppercase">Full</p>
                      <p className="text-[8px] opacity-70 font-bold uppercase">{isFullscreen ? 'ON' : 'OFF'}</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Reset */}
              <button 
                onClick={resetAll} 
                className="w-full h-12 rounded-2xl border-2 border-dashed border-rose-300/40 text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 hover:border-rose-300 transition-all active:scale-95"
              >
                <RotateCcw size={14}/>
                Restore Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Buttons */}
      <div className="fixed right-6 z-[95] flex flex-col gap-4 pointer-events-none transition-all duration-700" style={{ bottom: isFullscreen ? '40px' : 'calc(90px + env(safe-area-inset-bottom, 0px))' }}>
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
    const hImg = (e: any) => setZoomImg(e.currentTarget.src);
    imgs.forEach(img => { img.style.cursor = 'zoom-in'; img.addEventListener('click', hImg); });
    return () => { el.removeEventListener('copy', preventCopy); el.removeEventListener('cut', preventCopy); imgs.forEach(img => img.removeEventListener('click', hImg)); };
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
          <img src={zoomImg} alt="Zoomed" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-in" />
        </div>
      )}
    </>
  );
}
