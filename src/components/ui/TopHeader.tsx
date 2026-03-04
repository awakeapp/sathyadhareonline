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
    <header className="sticky top-0 z-50 w-full transition-colors duration-300" style={{ background: 'var(--color-background)' }}>
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
        <div className="flex items-center gap-3 relative">

          {/* Theme Toggle Icon in Header */}
          <button 
            onClick={toggleTheme}
            className="tap-highlight p-2 rounded-xl text-text hover:bg-surface transition-all active:scale-95 flex items-center justify-center"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          {/* Grid icon (More) */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="tap-highlight p-2 rounded-xl text-text hover:bg-surface transition-all active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <rect x="4"  y="4"  width="6" height="6" rx="1.5" />
              <rect x="14" y="4"  width="6" height="6" rx="1.5" />
              <rect x="4"  y="14" width="6" height="6" rx="1.5" />
              <rect x="14" y="14" width="6" height="6" rx="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sidebar Overlay and Menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        >
          {/* Sidebar Drawer */}
          <div 
            className="w-[85%] max-w-[340px] h-full bg-background shadow-2xl flex flex-col relative animate-in slide-in-from-right duration-300 transform overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <img 
                src={theme === 'dark' ? '/logo-light.png' : '/logo-dark.png'} 
                alt="Sathyadhare Logo" 
                className="h-[28px] object-contain"
                suppressHydrationWarning
              />
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface text-text hover:bg-surface-2 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-none">
              
              {/* Donate Button */}
              <div className="flex justify-center my-6">
                <button className="flex items-center gap-2 bg-[#ffe500] text-black px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-sm shadow-md hover:scale-105 active:scale-95 transition-all">
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="black">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  DONATE NOW
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-4 mt-4">
                {[
                  { name: 'Editorials', slug: 'editorials' },
                  { name: 'Education', slug: 'education' },
                  { name: 'Friday Message', slug: 'friday-message', highlight: true },
                  { name: 'Readers Corner', slug: 'readers-corner', highlight: true },
                  { name: 'History', slug: 'history', highlight: true },
                  { name: 'Literature', slug: 'literature' },
                  { name: 'Politics', slug: 'politics' },
                  { name: 'Interview', slug: 'interview' },
                  { name: 'Religion', slug: 'religion', highlight: true },
                  { name: 'Science', slug: 'science' },
                  { name: 'About Us', slug: 'about-us' },
                ].map((item) => (
                  <Link 
                    key={item.name}
                    href={item.slug === 'about-us' ? '/about' : `/categories/${item.slug}`} 
                    className={`text-[15px] font-semibold transition-colors ${item.highlight ? 'text-[#ffe500]' : 'text-text hover:text-primary'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Admin and Auth Links */}
                <div className="h-[1px] w-full bg-border my-2" />
                
                {(role === 'admin' || role === 'super_admin') && (
                  <Link 
                    href="/admin" 
                    className="text-[13px] font-black text-[#0047ff] dark:text-[#ffe500] uppercase tracking-widest py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                {user ? (
                   <Link 
                   href="/logout" 
                   className="text-[13px] font-bold text-red-400 uppercase tracking-widest py-1"
                   onClick={() => setIsMenuOpen(false)}
                 >
                   Logout
                 </Link>
                ) : (
                  <Link 
                  href="/login" 
                  className="text-[13px] font-bold text-text uppercase tracking-widest py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                )}
              </nav>
            </div>

            {/* Footer / Subscribe block */}
            <div className="bg-surface-2 p-6 flex flex-col items-center text-center mt-auto">
              <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest mb-2">
                Subscribe
              </span>
              <p className="text-xs text-text mb-4">
                To get email updates from Sathyadhare
              </p>
              
              {/* Social Icons Placeholder */}
              <div className="flex gap-4">
                {[
                  { name: 'fb', icon: <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/> },
                  { name: 'ig', icon: <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 6.5h11a5 5 0 015 5v11a5 5 0 01-5 5h-11a5 5 0 01-5-5v-11a5 5 0 015-5z"/> },
                  { name: 'yt', icon: <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29.01 29.01 0 001 11.75a29.13 29.13 0 00.46 5.33 2.78 2.78 0 001.94 2C5.12 19.5 12 19.5 12 19.5s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29.01 29.01 0 00.46-5.33 29.01 29.01 0 00-.46-5.33z"/> },
                  { name: 'x',  icon: <path d="M4 4l16 16M4 20L20 4"/> } // Simple X icon
                ].map((social) => (
                  <button key={social.name} className="text-text hover:text-primary transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      {social.icon}
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      )}

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
