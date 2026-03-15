'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { useReaderMode } from '@/context/ReaderModeContext';

interface BottomNavigationProps {
  user?: User | null;
  role?: string | null;
}

// ── Reader nav items ──────────────────────────────────────────────
const READER_NAV: { label: string; href: string; exact: boolean; icon: React.ReactNode }[] = [
  {
    label: 'Home',
    href: '/',
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    label: 'Sequels',
    href: '/sequels',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
        <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 14H8v-2h8v2zm0-4H8v-2h8v2zm0-4H8V6h8v2z" />
      </svg>
    ),
  },
  {
    label: 'Search',
    href: '/search',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-[22px] h-[22px]">
        <circle cx="11" cy="11" r="7" />
        <path d="M16 16l5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Saved',
    href: '/saved',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
      </svg>
    ),
  },
  {
    label: 'More',
    href: '/categories',
    exact: false,
    // 3-bar hamburger
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className="w-[22px] h-[22px]">
        <line x1="3" y1="6"  x2="21" y2="6"  />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    ),
  },
];

// ── Admin nav items ───────────────────────────────────────────────
const ADMIN_NAV: { label: string; href: string; exact: boolean; icon: React.ReactNode }[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    label: 'Articles',
    href: '/admin/articles',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    ),
  },
  {
    label: 'Users',
    href: '/admin/users',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    label: 'Categories',
    href: '/admin/categories',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
        <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z" />
      </svg>
    ),
  },
  {
    label: 'More',
    href: '/admin/sequels',
    exact: false,
    // 3-bar hamburger for admin too
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className="w-[22px] h-[22px]">
        <line x1="3" y1="6"  x2="21" y2="6"  />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    ),
  },
];

export default function BottomNavigation({ role }: BottomNavigationProps) {
  const pathname    = usePathname()
  const { readerMode } = useReaderMode()

  const isAuthPage  = pathname === '/login' || pathname === '/signup'
  const isPrivilegedRole = role === 'super_admin' || role === 'admin' || role === 'editor'

  // Show admin nav only when on admin routes AND not in reader mode
  const isAdminView = (pathname.startsWith('/admin') || pathname.startsWith('/editor')) &&
    isPrivilegedRole &&
    !readerMode

  const NAV = isAdminView ? ADMIN_NAV : READER_NAV

  if (isAuthPage) return null

  // Brand colors
  const ACTIVE_COLOR   = isAdminView ? '#4f8ef7' : '#685de6';
  const INACTIVE_COLOR = 'var(--color-muted)';

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-50 glass-premium shadow-[0_-10px_40px_rgba(0,0,0,0.12)]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch justify-around h-[56px]">
        {NAV.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : item.href !== '/' && pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => {
                import('@/lib/haptics').then(({ haptics }) => haptics.impact('light'));
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('transition_type', 'slide-up');
                }
              }}
              className="relative flex flex-col items-center justify-center flex-1 gap-[3px] transition-transform active:scale-[0.98]"
            >
              {/* Active indicator — thin top bar (WhatsApp style) */}
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full transition-all duration-300"
                style={{
                  width:   isActive ? '28px' : '0px',
                  height:  '3px',
                  background: ACTIVE_COLOR,
                  opacity: isActive ? 1 : 0,
                }}
              />

              {/* Icon */}
              <span
                className="transition-all duration-200"
                style={{ color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR }}
              >
                {item.icon}
              </span>

              {/* Label */}
              <span
                className="text-[10px] font-semibold tracking-wide transition-colors duration-200"
                style={{ color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR }}
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
