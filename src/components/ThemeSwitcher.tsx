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
    return <div className="w-10 h-10 opacity-0 min-w-[44px] min-h-[44px]" />;
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('sepia');
    else if (theme === 'sepia') setTheme('dark');
    else setTheme('light');
  };

  return (
    <button
      onClick={cycleTheme}
      className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-transform active:scale-95 min-w-[44px] min-h-[44px]"
      aria-label="Cycle theme"
      title={`Current: ${theme}. Click to switch.`}
    >
      {theme === 'dark' ? (
        <Moon size={22} strokeWidth={2.25} />
      ) : theme === 'sepia' ? (
        <Coffee size={22} strokeWidth={2.25} className="text-[#926b0a]" />
      ) : (
        <Sun size={22} strokeWidth={2.25} className="text-amber-500" />
      )}
    </button>
  );
}
