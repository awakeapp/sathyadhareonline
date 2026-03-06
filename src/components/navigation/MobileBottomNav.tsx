'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV, EDITOR_NAV, READER_NAV } from './nav-items';
import { useReaderMode } from '@/context/ReaderModeContext';

interface MobileBottomNavProps {
  role?: string | null;
}

export default function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { readerMode, enableReaderMode } = useReaderMode();

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isPrivilegedRole = role === 'super_admin' || role === 'admin' || role === 'editor';
  
  const isAdminView = (pathname.startsWith('/admin') || pathname.startsWith('/editor')) &&
    isPrivilegedRole &&
    !readerMode;

  const activeNav = (isAdminView 
    ? (pathname.startsWith('/admin') ? ADMIN_NAV : EDITOR_NAV)
    : READER_NAV).filter(item => !item.role || item.role === role).slice(0, 5); // Max 5 items for bottom nav

  if (isAuthPage) return null;

  const BG_COLOR = isAdminView ? 'var(--color-surface)' : 'var(--color-background)';
  const BORDER_COLOR = 'var(--color-border)';

  return (
    <nav
      aria-label="Bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 transition-colors duration-300"
      style={{
        background: BG_COLOR,
        borderTop: `1px solid ${BORDER_COLOR}`,
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -2px 20px rgba(0,0,0,0.1)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2 sm:px-4">
        {activeNav.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href) && item.href !== '/';
            
          const isHighlight = 'highlight' in item && item.highlight;
          const activeColorClass = isAdminView ? 'text-[#4f8ef7]' : 'text-[#ffe500]';

          if ('readerModeToggle' in item && item.readerModeToggle) {
            return (
              <button
                key={item.href}
                onClick={() => enableReaderMode()}
                className="tap-highlight flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-all text-[var(--color-muted)] hover:text-[var(--color-text)] focus:outline-none"
              >
                <div className="relative">
                  <item.icon size={22} className="stroke-[2.2px]" />
                </div>
                <span className="text-[10px] font-semibold tracking-wide truncate">
                  {item.name}
                </span>
              </button>
            );
          }

          if ('isMoreToggle' in item && item.isMoreToggle) {
            return (
              <button
                key={item.name}
                onClick={() => window.dispatchEvent(new Event('toggle-drawer'))}
                className="tap-highlight flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-all text-[var(--color-muted)] hover:text-[var(--color-text)] focus:outline-none"
              >
                <div className="relative">
                  <item.icon size={22} className="stroke-[2.2px]" />
                </div>
                <span className="text-[10px] font-semibold tracking-wide truncate">
                  {item.name}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`tap-highlight flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-all focus:outline-none ${
                isActive ? activeColorClass : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <div className="relative">
                <item.icon size={22} className={`stroke-[2.2px] ${isHighlight ? 'text-violet-400' : ''}`} />
                {isActive && (
                  <span className={`absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5 ${isHighlight ? 'hidden' : ''}`}>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${
                      isAdminView ? 'bg-[#4f8ef7]' : 'bg-[#ffe500]'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isAdminView ? 'bg-[#4f8ef7]' : 'bg-[#ffe500]'
                    }`}></span>
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-wide truncate ${isHighlight ? 'text-violet-400' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
