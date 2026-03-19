'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Share2, Link as LinkIcon, Check, Bookmark, Heart, Volume2, Square } from 'lucide-react';
import { toast } from '@/lib/toast';
import { createClient } from '@/lib/supabase/client';
import AuthPromptSheet from '@/components/AuthPromptSheet';
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
  slug: string;
  title: string;
  content: string;
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
    } min-w-[44px] min-h-[44px]`}
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
    if (window.speechSynthesis.getVoices().length) {
      applyVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = applyVoice;
    }
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
      className="relative w-10 h-10 flex items-center justify-center shrink-0 min-w-[44px] min-h-[44px]"
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
      } min-w-[44px] min-h-[44px]`}>
        {playing ? <Square size={16} fill="currentColor" strokeWidth={2.5} /> : <Volume2 size={16} strokeWidth={2.5} />}
      </div>
    </button>
  );
}

/* ─── MAIN EXPORT: full action bar ───────────────────────── */
export default function ArticleActionBar({
  slug, title, content,
  isAuthenticated, initialSaved, onSave, onUnsave,
}: ArticleActionBarProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [liked, setLiked] = useState(false);
  const [isClientAuth, setIsClientAuth] = useState(isAuthenticated);
  const [showAuthSheet, setShowAuthSheet] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.pathname : `/articles/${slug}`;

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
      setShowAuthSheet(true);
      return;
    }
    import('@/lib/haptics').then(({ haptics }) => haptics.impact('light'));
    if (saved) { 
      setSaved(false); 
      if (onUnsave) await onUnsave(); 
    } else { 
      setSaved(true); 
      if (onSave) await onSave(); 
    }
  };

  return (
    <div className="mb-4">
      <AuthPromptSheet
        open={showAuthSheet}
        onClose={() => setShowAuthSheet(false)}
        returnTo={currentUrl}
        message="Sign in to save articles and highlights"
      />
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
    </div>
  );
}
