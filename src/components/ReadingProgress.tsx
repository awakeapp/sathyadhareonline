'use client';

import { useEffect, useState } from 'react';

interface Props { 
  estimatedMinutes?: number;
}

export default function ReadingProgress({ estimatedMinutes }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const timeLeft = estimatedMinutes ? Math.max(1, Math.ceil(estimatedMinutes * (1 - progress / 100))) : null;

  return (
    <>
      <div
        className="fixed top-0 left-0 z-[9999] h-[3px] bg-[var(--color-primary)] transition-[width] duration-75 ease-out shadow-[0_0_10px_var(--color-primary)]"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
      
      {timeLeft !== null && progress > 5 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest pointer-events-none hide-in-fullscreen animate-fade-in transition-opacity whitespace-nowrap">
          {timeLeft} {timeLeft === 1 ? 'min' : 'mins'} left
        </div>
      )}
    </>
  );
}
