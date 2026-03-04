'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface BottomNavigationProps {
  user?: User | null;
  role?: string | null;
}

const NAV_ITEMS = [
  {
    label: 'HOME',
    href: '/',
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    label: 'SEQUELS',
    href: '/sequels',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 14H8v-2h8v2zm0-4H8v-2h8v2zm0-4H8V6h8v2z" />
      </svg>
    ),
  },
  {
    label: 'BROWSE',
    href: '/search',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
        <circle cx="11" cy="11" r="7" />
        <path d="M16 16l5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'PODCAST',
    href: '/podcast',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.071 4.929a10 10 0 0 0-14.142 0M16.243 7.757a6 6 0 0 0-8.486 0" strokeLinecap="round" />
        <path d="M12 15v6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'MORE',
    href: '/categories',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <rect x="4"  y="4"  width="6" height="6" rx="1.5" />
        <rect x="14" y="4"  width="6" height="6" rx="1.5" />
        <rect x="4"  y="14" width="6" height="6" rx="1.5" />
        <rect x="14" y="14" width="6" height="6" rx="1.5" />
      </svg>
    ),
  },
];

const ADMIN_NAV_ITEMS = [
  {
    label: 'DASHBOARD',
    href: '/admin',
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    label: 'ARTICLES',
    href: '/admin/articles',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    ),
  },
  {
    label: 'USERS',
    href: '/admin/users',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    label: 'CATEGORIES',
    href: '/admin/categories',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z" />
      </svg>
    ),
  },
];

export default function BottomNavigation({ role }: BottomNavigationProps) {
  const pathname = usePathname();
  const isAdminView = pathname.startsWith('/admin') && role === 'super_admin';
  const CURRENT_NAV_ITEMS = isAdminView ? ADMIN_NAV_ITEMS : NAV_ITEMS;

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pointer-events-none"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <div 
        className={`mx-auto flex flex-row items-center justify-between px-2 h-16 pointer-events-auto shadow-[0_-4px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl border rounded-[1.5rem] ${isAdminView ? 'border-white/20' : 'border-border/50'}`}
        style={{ 
          width: '100%', 
          maxWidth: '420px', 
          transition: 'background-color 0.3s',
          background: isAdminView ? 'rgba(15,82,186,0.95)' : 'var(--color-surface)',
        }}
      >
        {CURRENT_NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : item.href !== '/' && pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full tap-highlight gap-1"
            >
              <div
                className="flex items-center justify-center transition-all duration-300"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: isActive ? (isAdminView ? '#ffffff' : '#ffe500') : 'transparent',
                  color: isActive ? (isAdminView ? '#0f52ba' : '#181623') : 'var(--color-muted)',
                }}
              >
                {item.icon}
              </div>
              <span 
                className="text-[8px] font-black tracking-wider transition-colors"
                style={{ color: isActive ? (isAdminView ? '#ffffff' : '#ffe500') : 'var(--color-muted)' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
