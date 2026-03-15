'use client';

import { useState, useRef, useEffect } from 'react';
import { Share2, Link as LinkIcon, Check, Bookmark, Heart, Volume2, Square, X, FileText, AlignLeft, Loader2, ChevronDown, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

/* ─── helpers ─────────────────────────────────────────────── */
function getArticleUrl(slug: string) {
  return `${typeof window !== 'undefined' ? window.location.origin : 'https://sathyadhareonline.vercel.app'}/articles/${slug}`;
}

function cleanForSpeech(html: string, title?: string): string {
  if (typeof document === 'undefined') return '';
  const div = document.createElement('div');
  div.innerHTML = html
    .replace(/<(script|style|code|pre)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/<\/p>/gi, '. ')
    .replace(/<\/li>/gi, ', ')
    .replace(/<[^>]+>/g, '');
  
  // Preserve core punctuation for natural pausing
  let c = (div.textContent || div.innerText || '')
    .replace(/\s+/g, ' ')
    .replace(/(\.|\?|!)\s/g, '$1... ') // Add slight pause marker for some engines
    .trim();
  
  c = c.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');
  c = c.replace(/https?:\/\/\S+/g, '');
  return (title ? `${title}. ` : '') + c;
}

function getBestMaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined') return null;
  const v = window.speechSynthesis.getVoices();
  // Priority: Kannada Male -> Kannada (Any) -> English Male
  return v.find(x => x.lang.startsWith('kn') && (x.name.toLowerCase().includes('male') || x.name.toLowerCase().includes('google')))
    || v.find(x => x.lang.startsWith('kn'))
    || v.find(x => ['David','Guy','James','Microsoft Ravi','Google English'].some(n => x.name.includes(n)))
    || null;
}

/* ─── types ───────────────────────────────────────────────── */
interface ArticleActionBarProps {
  articleId: string;
  slug: string;
  title: string;
  content: string;
  existingSummary?: string | null;
  isAuthenticated?: boolean;
  initialSaved?: boolean;
  onSave?: () => void;
  onUnsave?: () => void;
}

/* ── Icon button base ── */
const IBtn = ({
  onClick, active, blue, children, title: tip, badge,
}: {
  onClick?: () => void;
  active?: boolean;
  blue?: boolean;
  children: React.ReactNode;
  title?: string;
  badge?: string;
}) => (
  <button
    onClick={onClick}
    title={tip}
    className={`relative w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform active:scale-[0.96] ${
      blue
        ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25 hover:bg-[var(--color-primary)]/90'
        : active
        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
        : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
    }`}
  >
    {children}
    {badge && (
      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

/* ─── Speaker button with circular progress ───────────────── */
function SpeakerButton({ content, title }: { content: string; title?: string }) {
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const cleanRef = useRef('');

  useEffect(() => { cleanRef.current = cleanForSpeech(content, title); }, [content, title]);

  const speak = () => {
    const txt = cleanRef.current;
    if (!txt || !supported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'kn-IN'; u.rate = 0.85; u.pitch = 0.9; u.volume = 1;
    const applyVoice = () => { const v = getBestMaleVoice(); if (v) u.voice = v; };
    window.speechSynthesis.getVoices().length ? applyVoice() : (window.speechSynthesis.onvoiceschanged = applyVoice);
    u.onstart = () => { setPlaying(true); setPaused(false); };
    u.onboundary = (e) => { if (txt.length) setProgress(Math.round((e.charIndex / txt.length) * 100)); };
    u.onend = () => { setPlaying(false); setPaused(false); setProgress(0); };
    u.onerror = () => { setPlaying(false); setPaused(false); };
    window.speechSynthesis.speak(u);
  };

  const handleClick = () => {
    if (!playing && !paused) speak();
    else if (playing) { window.speechSynthesis.pause(); setPlaying(false); setPaused(true); }
    else { window.speechSynthesis.resume(); setPlaying(true); setPaused(false); }
  };

  const stopAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
    setProgress(0);
  };

  if (!supported) return null;

  const RADIUS = 17;
  const CIRC = 2 * Math.PI * RADIUS;
  const offset = CIRC - (CIRC * progress) / 100;

  return (
    <button
      onClick={playing ? stopAudio : handleClick}
      title={playing ? 'Stop' : paused ? 'Resume' : 'Listen'}
      className="relative w-10 h-10 flex items-center justify-center shrink-0"
    >
      {/* Circular progress track */}
      {(playing || paused) && (
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r={RADIUS} fill="none" stroke="currentColor" strokeWidth="2"
            className="text-[var(--color-border)]" />
          <circle cx="20" cy="20" r={RADIUS} fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeDasharray={CIRC} strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-emerald-500 transition-all duration-500" />
        </svg>
      )}

      {/* The icon circle */}
      <div className={`relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
        playing || paused
          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
          : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] border border-[var(--color-border)]'
      }`}>
        {playing ? <Square size={16} fill="currentColor" strokeWidth={2.5} /> : <Volume2 size={16} strokeWidth={2.5} />}
      </div>
    </button>
  );
}

/* ─── AI Summary strip ────────────────────────────────────── */
function AISummaryStrip({
  articleId, content, title, existingSummary,
}: { articleId: string; content: string; title: string; existingSummary?: string | null }) {
  const [summary, setSummary] = useState<string | null>(existingSummary || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const generate = async () => {
    if (loading) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, content, title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      if (!data.summary) throw new Error('No summary returned');
      
      setSummary(data.summary);
      setOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!content || content.length < 300) return null;

  return (
    <div className="mb-6 overflow-hidden">
      {/* Trigger strip — always visible */}
      <button
        onClick={() => {
          if (!summary) generate();
          else setOpen(o => !o);
        }}
        disabled={loading}
        className={`w-full flex items-center gap-3 px-4 h-11 rounded-2xl border transition-all text-left group ${
          open
            ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/30 rounded-b-none border-b-0'
            : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
        }`}
      >
        {/* Icon */}
        <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center transition-all ${
          summary ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
        }`}>
          {loading ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
        </div>

        <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-primary)] flex-1">
          {loading ? 'Summarizing…' : error ? error : summary ? 'Summary' : 'Summarize Article'}
        </span>

        {!summary && !loading && (
          <div className="flex items-center gap-1.5 px-3 h-7 rounded-xl bg-[var(--color-primary)] text-white text-[9px] font-black uppercase tracking-wider shrink-0 shadow-md shadow-[var(--color-primary)]/25 group-hover:bg-[var(--color-primary)]/90 transition-colors">
            <AlignLeft size={10} />
            Summarize
          </div>
        )}
        {summary && (
          <ChevronDown size={14} className={`text-[var(--color-primary)] shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Summary panel — slides open */}
      {open && summary && (
        <div className="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/25 border-t-0 rounded-b-2xl px-5 py-4 animate-fade-in">
          <p className="text-[13.5px] leading-relaxed text-[var(--color-text)] font-medium mb-3">
            {summary}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-primary)]/50 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[var(--color-primary)]/40 inline-block" />
              Gemini 1.5 Flash
            </span>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[var(--color-muted)] hover:text-rose-500 transition-colors"
            >
              <X size={11} />
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { ReaderSettingsSheet } from './ReaderSettingsSheet';

/* ─── MAIN EXPORT: full action bar ───────────────────────── */
export default function ArticleActionBar({
  articleId, slug, title, content, existingSummary,
  isAuthenticated, initialSaved, onSave, onUnsave,
}: ArticleActionBarProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [liked, setLiked] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClientAuth, setIsClientAuth] = useState(isAuthenticated);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setIsClientAuth(true);
      // We could also re-fetch the user's bookmark status here if we wanted to be perfectly in sync
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsClientAuth(!!session?.user);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const copy = async () => {
    const url = getArticleUrl(slug);
    try { await navigator.clipboard.writeText(url); }
    catch { const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
    setCopied(true);
    import('@/lib/haptics').then(({ haptics }) => haptics.success());
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    const url = getArticleUrl(slug);
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch {}
    } else { copy(); }
  };

  const toggleSave = async () => {
    if (!isClientAuth) {
      toast.error('Please sign in to save articles.');
      return;
    }
    import('@/lib/haptics').then(({ haptics }) => haptics.impact('light'));
    if (saved) { setSaved(false); onUnsave?.(); }
    else { setSaved(true); onSave?.(); }
  };

  return (
    <div className="mb-4">
      {/* ── Action row ── */}
      <div className="flex items-center gap-2">

        {/* Share — blue, primary */}
        <IBtn onClick={share} blue title="Share article">
          <Share2 size={16} strokeWidth={2.5} />
        </IBtn>

        {/* Copy link */}
        <IBtn onClick={copy} active={copied} title={copied ? 'Copied!' : 'Copy link'}>
          {copied ? <Check size={16} strokeWidth={3} /> : <LinkIcon size={16} strokeWidth={2.5} />}
        </IBtn>

        {/* Save / Bookmark */}
        <IBtn onClick={toggleSave} active={saved} title={saved ? 'Saved' : 'Save article'}>
          <Bookmark size={16} strokeWidth={2.5} className={saved ? 'fill-[var(--color-primary)]' : ''} />
        </IBtn>

        {/* Reader Appearance */}
        <IBtn onClick={() => setIsSettingsOpen(true)} title="Appearance settings">
          <Settings size={16} strokeWidth={2.5} />
        </IBtn>

        {/* Speaker with circular progress */}
        <SpeakerButton content={content} title={title} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Like */}
        <button
          onClick={() => {
            import('@/lib/haptics').then(({ haptics }) => !liked ? haptics.success() : haptics.impact('light'));
            setLiked(l => !l);
          }}
          className={`flex items-center gap-1.5 h-10 px-4 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-transform active:scale-[0.96] border ${
            liked
              ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/25'
              : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] border border-[var(--color-border)] hover:border-rose-400 hover:text-rose-500'
          }`}
        >
          <Heart size={14} className={liked ? 'fill-white' : ''} strokeWidth={2.5} />
          {liked ? 'Liked' : 'Like'}
        </button>
      </div>

      <ReaderSettingsSheet isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* ── AI Summary strip (below action row, before content) ── */}
      <div className="mt-4">
        <AISummaryStrip
          articleId={articleId}
          content={content}
          title={title}
          existingSummary={existingSummary}
        />
      </div>
    </div>
  );
}
