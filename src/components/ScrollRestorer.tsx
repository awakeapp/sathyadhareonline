'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';

interface ScrollRestorerProps {
  storageKey: string;
  isAuthenticated: boolean;
  userId?: string;
}

export function ScrollRestorer({ storageKey, isAuthenticated, userId }: ScrollRestorerProps) {
  const isRestored = useRef(false);

  useEffect(() => {
    isRestored.current = false;
    
    // For authenticated users, use localStorage (persists across closed app).
    // For guests, use sessionStorage (cleared when app/tab is closed).
    const storage = isAuthenticated ? localStorage : sessionStorage;
    
    // Create specific prefix key
    const finalKey = isAuthenticated 
      ? `sathyadhare_scroll_${userId}_${storageKey}` 
      : `sathyadhare_scroll_guest_${storageKey}`;

    // 1. On mount, try to restore
    if (!isRestored.current) {
      const saved = storage.getItem(finalKey);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val > 150) { // Only restore if significant
          // Delay briefly to allow content/images to render and define doc height
          setTimeout(() => {
            window.scrollTo({ top: val, behavior: 'auto' });
            
          toast.custom((id) => (
            <div className="pointer-events-auto flex items-center justify-between gap-6 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl px-6 py-4.5 rounded-[1.5rem] min-w-[340px] max-w-[95vw] overflow-hidden group animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all duration-500">
                  <RotateCcw size={22} strokeWidth={2.5} className="group-hover:rotate-[-180deg] transition-transform duration-700" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-[14px] font-black text-[var(--color-text)] tracking-tight">Resumed reading</h3>
                  <p className="text-[11px] font-bold text-[var(--color-muted)] leading-tight opacity-80">You&apos;re back where you left off.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  storage.removeItem(finalKey);
                  toast.dismiss(id);
                }}
                className="px-5 py-2.5 bg-[var(--color-surface-2)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-90 shrink-0 border border-[var(--color-border)]/50 shadow-sm"
              >
                Reset
              </button>
            </div>
          ), { 
            duration: 7000,
            id: 'scroll-restore-toast' 
          });
          }, 600); 
        }
      }
      isRestored.current = true;
    }

    // 2. Track scrolling and save
    let timeoutId: NodeJS.Timeout;

    const savePosition = () => {
      const scrollY = window.scrollY;
      if (isRestored.current && scrollY >= 0) {
        storage.setItem(finalKey, scrollY.toString());
      }
    };

    const onScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(savePosition, 500); 
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        savePosition();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', savePosition);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', savePosition);
      clearTimeout(timeoutId);
      // Try to save on unmount as well
      savePosition();
    };
  }, [storageKey, isAuthenticated, userId]);

  return null;
}
