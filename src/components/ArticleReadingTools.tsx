'use client';

import { useState, useRef, useEffect } from 'react';
import { Pause, Play, Square, Sliders } from 'lucide-react';
import AISummaryBox from './AISummaryBox';
import { Headphones } from 'lucide-react';

/* ─── Speech helpers ─────────────────────────────────────── */
function cleanForSpeech(html: string, title?: string): string {
  const div = document.createElement('div');
  div.innerHTML = html
    .replace(/<(script|style|code|pre)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/<\/p>/gi, '. ')
    .replace(/<\/li>/gi, ', ')
    .replace(/<[^>]+>/g, '');
  let clean = (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
  clean = clean.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');
  clean = clean.replace(/https?:\/\/\S+/g, '');
  clean = clean.replace(/\.{2,}/g, '.').replace(/,{2,}/g, ',');
  return (title ? `${title}. ` : '') + clean;
}

/* ─── Audio Listen Pill ──────────────────────────────────── */
function AudioPill({ text, title }: { text: string; title?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const [rate, setRate] = useState(0.9);
  const [pitch, setPitch] = useState(0.8);
  const [showMods, setShowMods] = useState(false);
  const cleanRef = useRef('');

  useEffect(() => { cleanRef.current = cleanForSpeech(text, title); }, [text, title]);

  const getMaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => v.lang.startsWith('kn') && v.name.toLowerCase().includes('male'))
      || voices.find(v => v.lang.startsWith('kn'))
      || voices.find(v => ['David','Guy','James'].some(n => v.name.includes(n)))
      || null;
  };

  const speak = () => {
    const clean = cleanRef.current;
    if (!clean || !supported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'kn-IN'; u.rate = rate; u.pitch = pitch; u.volume = 1;
    const applyVoice = () => { const v = getMaleVoice(); if (v) u.voice = v; };
    window.speechSynthesis.getVoices().length ? applyVoice() : (window.speechSynthesis.onvoiceschanged = applyVoice);
    u.onstart  = () => { setIsPlaying(true);  setIsPaused(false); };
    u.onboundary = (e) => { if (clean.length) setProgress(Math.round((e.charIndex / clean.length) * 100)); };
    u.onend    = () => { setIsPlaying(false); setIsPaused(false); setProgress(0); };
    u.onerror  = () => { setIsPlaying(false); setIsPaused(false); };
    window.speechSynthesis.speak(u);
  };

  const handlePlayPause = () => {
    if (!isPlaying && !isPaused) speak();
    else if (isPlaying) { window.speechSynthesis.pause(); setIsPlaying(false); setIsPaused(true); }
    else { window.speechSynthesis.resume(); setIsPlaying(true); setIsPaused(false); }
  };
  const handleStop = () => { window.speechSynthesis.cancel(); setIsPlaying(false); setIsPaused(false); setProgress(0); };

  if (!supported) return null;

  return (
    <div className="shrink-0">
      {/* Pill row */}
      <div className={`flex items-center h-12 px-3 gap-2.5 rounded-2xl border transition-all ${
        isPlaying || isPaused
          ? 'bg-[var(--color-primary)]/8 border-[var(--color-primary)]/25'
          : 'bg-[var(--color-surface)] border-[var(--color-border)]'
      }`}>

        {/* Icon label */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Headphones size={12} className={`${isPlaying ? 'text-[var(--color-primary)] animate-pulse' : 'text-[var(--color-muted)]'}`} />
          <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-muted)] hidden sm:block">Listen</span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--color-border)] shrink-0" />

        {/* Play button */}
        <button
          onClick={handlePlayPause}
          className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center transition-all ${
            isPlaying || isPaused
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface-2)] text-[var(--color-primary)]'
          }`}
        >
          {isPlaying ? <Pause size={12} strokeWidth={3} /> : <Play size={12} strokeWidth={3} className="ml-px" />}
        </button>

        {/* Progress bar */}
        <div className="w-20 h-1 bg-[var(--color-border)] rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Percent */}
        {(isPlaying || isPaused) && (
          <span className="text-[8px] font-black text-[var(--color-muted)] shrink-0 w-6">{progress}%</span>
        )}

        {/* Modulate toggle */}
        <button
          onClick={() => setShowMods(!showMods)}
          className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center transition-all ${
            showMods ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-muted)]'
          }`}
        >
          <Sliders size={10} />
        </button>

        {/* Stop */}
        {(isPlaying || isPaused) && (
          <button onClick={handleStop} className="w-5 h-5 shrink-0 rounded-md text-rose-400 flex items-center justify-center hover:text-rose-600 transition-colors">
            <Square size={9} fill="currentColor" />
          </button>
        )}
      </div>

      {showMods && (
        <div className="mt-2 p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-muted)]">Speed</span>
              <span className="text-[8px] font-black">{rate}x</span>
            </div>
            <input type="range" min="0.5" max="1.5" step="0.05" value={rate}
              onChange={e => setRate(parseFloat(e.target.value))}
              className="w-full accent-[var(--color-primary)] h-1 cursor-pointer" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-muted)]">Pitch</span>
              <span className="text-[8px] font-black">{pitch}</span>
            </div>
            <input type="range" min="0.5" max="1.2" step="0.05" value={pitch}
              onChange={e => setPitch(parseFloat(e.target.value))}
              className="w-full accent-[var(--color-primary)] h-1 cursor-pointer" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Unified Row Component ──────────────────────────────── */
interface ArticleReadingToolsProps {
  articleId: string;
  content: string;
  title: string;
  existingSummary?: string | null;
}

export default function ArticleReadingTools({ articleId, content, title, existingSummary }: ArticleReadingToolsProps) {
  return (
    <div className="mb-8">
      {/* One row — AI pill stretches, Audio pill is fixed-width, same h-12 height */}
      <div className="flex items-start gap-2">
        <AISummaryBox
          articleId={articleId}
          content={content}
          title={title}
          existingSummary={existingSummary}
        />
        <AudioPill text={content} title={title} />
      </div>
    </div>
  );
}

/* Re-export TextToSpeech for backward compat */
export function TextToSpeech({ text, title }: { text: string; title?: string }) {
  return <AudioPill text={text} title={title} />;
}
