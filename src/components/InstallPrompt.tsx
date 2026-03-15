'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="md:hidden fixed z-[100] bottom-[96px] left-4 right-4 p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between border glass-premium animate-fade-up rugged-shadow"
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 shadow-inner"
        >
          {/* Mobile Icon */}
          <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-[var(--color-text)]">Install Sathyadhare</span>
          <span className="text-[10px] uppercase tracking-widest font-black opacity-60 text-[var(--color-muted)]">Read faster & offline</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={() => {
            import('@/lib/haptics').then(({ haptics }) => haptics.impact('light'));
            setIsVisible(false);
          }}
          className="p-2 text-[9px] font-black uppercase tracking-widest text-[var(--color-muted)] hover:text-rose-500 transition-colors active:scale-90"
        >
          Later
        </button>
        <button
          onClick={() => {
            import('@/lib/haptics').then(({ haptics }) => haptics.success());
            handleInstallClick();
          }}
          className="px-5 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25 active:scale-95 transition-all"
        >
          Install
        </button>
      </div>
    </div>
  );
}
