'use client';

import { useState, useRef, useEffect } from 'react';
import { Pause, Play, Square, Sliders } from 'lucide-react';

interface TextToSpeechProps {
  text: string;
  title?: string;
}

export default function TextToSpeech({ text, title }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const [rate, setRate] = useState(0.95);
  const [pitch, setPitch] = useState(0.85);
  const [showMods, setShowMods] = useState(false);
  const cleanTextRef = useRef('');

  useEffect(() => {
    const div = document.createElement('div');
    div.innerHTML = text;
    cleanTextRef.current = (title ? `${title}. ` : '') + (div.textContent || div.innerText || '');
  }, [text, title]);

  const getMaleKannadaVoice = () => {
    if (typeof window === 'undefined') return null;
    const voices = window.speechSynthesis.getVoices();

    // Prefer male Kannada voices first
    const malePreferences = [
      'Microsoft Gadgil Online (Natural) - Kannada',
      'Google ಕನ್ನಡ',
      'kn-IN',
    ];

    for (const pref of malePreferences) {
      const v = voices.find(v => v.name.includes(pref) || v.lang === pref);
      if (v) return v;
    }

    // Fall back to any Kannada voice
    const knVoice = voices.find(v => v.lang.startsWith('kn'));
    if (knVoice) return knVoice;

    // Last resort: a deep male English voice
    return voices.find(v => v.name.toLowerCase().includes('male') || v.name.includes('Guy') || v.name.includes('David') || v.name.includes('James')) || null;
  };

  const startSpeech = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanTextRef.current);
    utterance.lang = 'kn-IN';

    // Wait for voices to load if needed
    const trySetVoice = () => {
      const voice = getMaleKannadaVoice();
      if (voice) utterance.voice = voice;
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = trySetVoice;
    } else {
      trySetVoice();
    }

    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => { setIsPlaying(true); setIsPaused(false); };
    utterance.onboundary = (e) => {
      setProgress(Math.round((e.charIndex / cleanTextRef.current.length) * 100));
    };
    utterance.onend = () => { setIsPlaying(false); setIsPaused(false); setProgress(0); };
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPause = () => {
    if (!isPlaying && !isPaused) {
      startSpeech();
    } else if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false); setIsPaused(true);
    } else {
      window.speechSynthesis.resume();
      setIsPlaying(true); setIsPaused(false);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false); setIsPaused(false); setProgress(0);
  };

  if (!supported) return null;

  return (
    <div className="w-full">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
        isPlaying || isPaused
          ? 'bg-[var(--color-primary)]/8 border-[var(--color-primary)]/30'
          : 'bg-[var(--color-surface)] border-[var(--color-border)]'
      }`}>
        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            isPlaying || isPaused
              ? 'bg-[var(--color-primary)] text-white shadow-lg'
              : 'bg-[var(--color-surface-2)] text-[var(--color-primary)]'
          }`}
        >
          {isPlaying ? <Pause size={20} strokeWidth={3} /> : <Play size={20} strokeWidth={3} className="ml-0.5" />}
        </button>

        {/* Progress + Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)]">
              {isPlaying ? 'Reading...' : isPaused ? 'Paused' : 'Listen'}
            </span>
            <span className="text-[9px] font-black text-[var(--color-muted)]">{progress}%</span>
          </div>
          <div className="h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => setShowMods(!showMods)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              showMods ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
            }`}
          >
            <Sliders size={14} />
          </button>
          {(isPlaying || isPaused) && (
            <button
              onClick={handleStop}
              className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
            >
              <Square size={13} fill="currentColor" />
            </button>
          )}
        </div>
      </div>

      {showMods && (
        <div className="mt-2 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl space-y-4">
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-muted)]">Speed</span>
              <span className="text-[9px] font-black">{rate}x</span>
            </div>
            <input type="range" min="0.5" max="1.8" step="0.05" value={rate}
              onChange={e => setRate(parseFloat(e.target.value))}
              className="w-full accent-[var(--color-primary)] h-1 rounded-full cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-muted)]">Pitch</span>
              <span className="text-[9px] font-black">{pitch}</span>
            </div>
            <input type="range" min="0.5" max="1.2" step="0.05" value={pitch}
              onChange={e => setPitch(parseFloat(e.target.value))}
              className="w-full accent-[var(--color-primary)] h-1 rounded-full cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
