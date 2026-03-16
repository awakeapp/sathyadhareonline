'use client';

import { useEffect, useRef } from 'react';


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
