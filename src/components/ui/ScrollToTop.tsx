'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed right-6 z-50 p-3 rounded-2xl bg-white/95 dark:bg-[#1a222c]/95 border border-[var(--color-border)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-[var(--color-text)] hover:bg-[var(--color-surface)] active:scale-90 transition-all backdrop-blur-xl animate-in fade-in zoom-in duration-200"
      style={{ bottom: 'calc(90px + env(safe-area-inset-bottom, 0px))' }}
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-6 h-6" strokeWidth={3} />
    </button>
  );
}
