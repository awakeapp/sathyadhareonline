'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/lib/haptics';

export function GestureProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [startX, setStartX] = useState(0);
  const [distX, setDistX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      // Slightly larger start zone for better accessibility on rugged devices
      if (touch.clientX < 45) {
        setStartX(touch.clientX);
        setIsSwiping(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return;
      const touch = e.touches[0];
      const diff = touch.clientX - startX;
      if (diff > 0) {
        setDistX(diff);
        // Prevent default browser behavior if we're actively swiping
        if (diff > 10) {
          if (e.cancelable) e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (distX > 100) {
        haptics.impact('light');
        router.back();
      }
      setIsSwiping(false);
      setDistX(0);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startX, distX, isSwiping, router]);

  return (
    <>
      {children}
      <AnimatePresence>
        {isSwiping && distX > 10 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed left-0 top-0 bottom-0 z-[9999] pointer-events-none flex items-center pl-4"
          >
            <div 
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl"
              style={{ opacity: Math.min(distX / 100, 1), transform: `scale(${Math.min(0.5 + distX / 200, 1.2)})` }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
