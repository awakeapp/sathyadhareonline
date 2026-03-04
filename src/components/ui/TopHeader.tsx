'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

interface Category {
  name: string;
  slug: string;
}

interface TopHeaderProps {
  user: User | null;
  role?: string | null;
  categories: Category[];
}

export default function TopHeader({ user, role, categories }: TopHeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Check current theme on mount
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(currentTheme);
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full" style={{ background: '#181623' }}>
      {/* Main bar */}
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">

        {/* Left: Logo */}
        <Link href="/" className="flex items-center flex-shrink-0 tap-highlight overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={theme === 'dark' ? '/logo-light.png' : '/logo-dark.png'} 
            alt="Sathyadhare Logo" 
            className="h-[28px] min-w-[120px] object-left object-contain drop-shadow-sm transition-opacity duration-300"
            suppressHydrationWarning
          />
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-2 relative">
          {/* Grid icon (More) */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="tap-highlight p-2 rounded-xl text-white hover:bg-white/10 transition-all active:scale-95"
            style={{ background: isMenuOpen ? 'rgba(255,255,255,0.1)' : 'transparent' }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <rect x="4"  y="4"  width="6" height="6" rx="1.5" />
              <rect x="14" y="4"  width="6" height="6" rx="1.5" />
              <rect x="4"  y="14" width="6" height="6" rx="1.5" />
              <rect x="14" y="14" width="6" height="6" rx="1.5" />
            </svg>
          </button>

          {/* Theme Dropdown / Menu */}
          {isMenuOpen && (
            <div 
              className="absolute right-0 top-12 w-48 rounded-2xl p-4 shadow-2xl border animate-fade-up"
              style={{ background: '#242235', borderColor: '#353347' }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between cursor-pointer group" onClick={toggleTheme}>
                  <span className="text-xs font-bold text-muted uppercase tracking-widest group-hover:text-white transition-colors">Theme</span>
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke={theme === 'dark' ? '#8b88a0' : 'white'} strokeWidth={1.8} className="w-3.5 h-3.5 transition-colors">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 4v1m0 14v1m7-8h1M4 12H3" />
                    </svg>
                    <div className="w-8 h-4 rounded-full bg-white flex items-center px-0.5 transition-all">
                      <div 
                        className="w-3 h-3 rounded-full transition-all duration-300" 
                        style={{ 
                          background: '#181623',
                          transform: theme === 'dark' ? 'translateX(16px)' : 'translateX(0px)'
                        }} 
                      />
                    </div>
                    <svg viewBox="0 0 24 24" fill={theme === 'dark' ? 'white' : '#8b88a0'} className="w-3.5 h-3.5 transition-colors">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </div>
                </div>
                
                <div className="h-[1px] w-full" style={{ background: '#353347' }} />
                
                <Link 
                  href="/categories" 
                  className="text-xs font-bold text-white uppercase tracking-widest py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Categories
                </Link>

                {(role === 'admin' || role === 'super_admin') && (
                  <Link 
                    href="/admin" 
                    className="text-[11px] font-black text-[#0047ff] dark:text-[#ffe500] uppercase tracking-widest py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}

                {user ? (
                   <Link 
                   href="/logout" 
                   className="text-xs font-bold text-red-400 uppercase tracking-widest py-1"
                   onClick={() => setIsMenuOpen(false)}
                 >
                   Logout
                 </Link>
                ) : (
                  <Link 
                  href="/login" 
                  className="text-xs font-bold text-white uppercase tracking-widest py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category pills row */}
      {categories.length > 0 && (
        <div className="px-4 sm:px-6 pb-3 pt-1">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <Link
              href="/"
              className="whitespace-nowrap flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all tap-highlight"
              style={
                pathname === '/'
                  ? { borderColor: '#ffe500', color: '#ffe500', background: 'rgba(255,229,0,0.1)' }
                  : { borderColor: '#2b293d', color: '#a3a0b5', background: '#242235' }
              }
            >
              ALL
            </Link>

            {categories.map((cat) => {
              const isActive = pathname === `/categories/${cat.slug}`;
              return (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="whitespace-nowrap flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all tap-highlight"
                  style={
                    isActive
                      ? { borderColor: '#ffe500', color: '#ffe500', background: 'rgba(255,229,0,0.1)' }
                      : { borderColor: '#2b293d', color: '#a3a0b5', background: '#242235' }
                  }
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
