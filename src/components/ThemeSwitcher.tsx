'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Coffee } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 opacity-0" />;
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('sepia');
    else if (theme === 'sepia') setTheme('dark');
    else setTheme('light');
  };

  return (
    <button
      onClick={cycleTheme}
      className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-transform active:scale-95"
      aria-label="Cycle theme"
      title={`Current: ${theme}. Click to switch.`}
    >
      {theme === 'dark' ? (
        <Moon size={18} strokeWidth={2.5} />
      ) : theme === 'sepia' ? (
        <Coffee size={18} strokeWidth={2.5} className="text-[#926b0a]" />
      ) : (
        <Sun size={18} strokeWidth={2.5} className="text-amber-500" />
      )}
    </button>
  );
}
