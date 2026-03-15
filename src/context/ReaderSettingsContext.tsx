'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: 'serif' | 'sans' | 'modern' | 'tiro';
  theme: 'light' | 'dark' | 'sepia';
}

interface ReaderSettingsContextValue {
  settings: ReaderSettings;
  updateSettings: (newSettings: Partial<ReaderSettings>) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.85,
  fontFamily: 'serif',
  theme: 'light',
};

const STORAGE_KEY = 'sathyadhare:readerSettings';

const ReaderSettingsContext = createContext<ReaderSettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
});

export function ReaderSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        requestAnimationFrame(() => {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        });
      }
    } catch {}
  }, []);

  const updateSettings = useCallback((newSettings: Partial<ReaderSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  // Synchronize with CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--article-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--article-line-height', `${settings.lineHeight}`);
    
    // Font family mapping
    const fontMapping = {
      serif: 'var(--font-noto-serif-kannada), serif',
      sans: 'var(--font-noto-sans-kannada), sans-serif',
      modern: 'var(--font-baloo-tamma), sans-serif',
      tiro: 'var(--font-tiro-kannada), serif',
    };
    root.style.setProperty('--article-font-family', fontMapping[settings.fontFamily]);
    
  }, [settings]);

  return (
    <ReaderSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </ReaderSettingsContext.Provider>
  );
}

export function useReaderSettings() {
  return useContext(ReaderSettingsContext);
}
