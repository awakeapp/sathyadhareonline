'use client';

import { useState, useRef, useEffect } from 'react';
import { Pause, Play, Square, Sliders } from 'lucide-react';

interface TextToSpeechProps {
  text: string;
  title?: string;
}

function cleanForSpeech(html: string, title?: string): string {
  const div = document.createElement('div');
  div.innerHTML = html
    .replace(/<(script|style|code|pre)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/<\/p>/gi, '. ')
    .replace(/<\/li>/gi, ', ')
    .replace(/<[^>]+>/g, '');
  let clean = div.textContent || div.innerText || '';
  clean = clean.replace(/\s+/g, ' ').trim();
  clean = clean.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');
  clean = clean.replace(/https?:\/\/\S+/g, '');
  clean = clean.replace(/\.{2,}/g, '.').replace(/,{2,}/g, ',');
  return (title ? `${title}. ` : '') + clean;
}

export default function TextToSpeech({ text, title }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const [rate, setRate] = useState(0.9);
  const [pitch, setPitch] = useState(0.8);
  const [showMods, setShowMods] = useState(false);
  const cleanTextRef = useRef('');

  useEffect(() => {
    cleanTextRef.current = cleanForSpeech(text, title);
  }, [text, title]);

  const getMaleVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(v => v.lang.startsWith('kn') && v.name.toLowerCase().includes('male')) ||
      voices.find(v => v.lang.startsWith('kn')) ||
      voices.find(v => v.name.includes('David') || v.name.includes('Guy') || v.name.includes('James')) ||
      null
    );
  };

  const speak = () => {
    const clean = cleanTextRef.current;
    if (!clean || !supported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'kn-IN';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;
    const applyVoice = () => { const v = getMaleVoice(); if (v) utterance.voice = v; };
    window.speechSynthesis.getVoices().length ? applyVoice() : (window.speechSynthesis.onvoiceschanged = applyVoice);
    utterance.onstart = () => { setIsPlaying(true); setIsPaused(false); };
    utterance.onboundary = (e) => { if (clean.length > 0) setProgress(Math.round((e.charIndex / clean.length) * 100)); };
    utterance.onend = () => { setIsPlaying(false); setIsPaused(false); setProgress(0); };
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); };
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPause = () => {
    if (!isPlaying && !isPaused) { speak(); }
    else if (isPlaying) { window.speechSynthesis.pause(); setIsPlaying(false); setIsPaused(true); }
    else { window.speechSynthesis.resume(); setIsPlaying(true); setIsPaused(false); }
  };

  const handleStop = () => { window.speechSynthesis.cancel(); setIsPlaying(false); setIsPaused(false); setProgress(0); };

  if (!supported) return null;

  return (
    <div className="w-full">
      {/* Compact single row */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePlayPause}
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
            isPlaying || isPaused
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface-2)] text-[var(--color-primary)] border border-[var(--color-border)]'
          } min-w-[44px] min-h-[44px]`}
        >
          {isPlaying ? <Pause size={14} strokeWidth={3} /> : <Play size={14} strokeWidth={3} className="ml-px" />}
        </button>

        <div className="flex-1 min-w-0 h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <button
          onClick={() => setShowMods(!showMods)}
          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all ${showMods ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-muted)]'}`}
        ><Sliders size={11} /></button>

        {(isPlaying || isPaused) && (
          <button onClick={handleStop} className="w-6 h-6 rounded-md text-rose-400 flex items-center justify-center shrink-0 hover:text-rose-600 transition-colors">
            <Square size={10} fill="currentColor" />
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
