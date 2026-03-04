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
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="md:hidden fixed z-[100] bottom-[96px] left-4 right-4 p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-between border animate-fade-up"
      style={{ 
        background: '#2b293d', 
        borderColor: '#353347'
      }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#181623' }}
        >
          {/* Mobile Icon */}
          <svg className="w-6 h-6" style={{ color: '#ffe500' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">Install Sathyadhare</span>
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: '#a3a0b5' }}>Read faster & offline</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsVisible(false)}
          className="p-1 px-2 text-[10px] font-bold uppercase tracking-widest transition-colors tap-highlight-none"
          style={{ color: '#a3a0b5' }}
        >
          Dismiss
        </button>
        <button
          onClick={handleInstallClick}
          className="px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg shadow-sm active:scale-95 transition-all tap-highlight-none"
          style={{ background: '#ffe500', color: '#181623' }}
        >
          Install
        </button>
      </div>
    </div>
  );
}
