'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SUPER_ADMIN_NAV, ADMIN_NAV, EDITOR_NAV, READER_NAV } from './nav-items';
import { useReaderMode } from '@/context/ReaderModeContext';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

interface SidebarProps {
  role?: string | null;
}

export function DesktopSidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { readerMode, enableReaderMode } = useReaderMode();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isPrivilegedRole = role === 'super_admin' || role === 'admin' || role === 'editor';
  
  const isAdminView = (pathname.startsWith('/admin') || pathname.startsWith('/editor')) &&
    isPrivilegedRole &&
    !readerMode;

  const activeNav = (isAdminView 
    ? (pathname.startsWith('/admin') ? (role === 'super_admin' ? SUPER_ADMIN_NAV : ADMIN_NAV) : EDITOR_NAV)
    : READER_NAV);

  if (isAuthPage) return null;

  return (
    <aside 
      className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-300 border-r sticky top-0 h-screen ${
        isCollapsed ? 'w-20' : 'w-64'
      } ${
        isAdminView 
          ? 'bg-[var(--color-surface)] border-[var(--color-border)]' 
          : 'bg-[var(--color-background)] border-[var(--color-border)]'
      }`}
    >
      {/* Brand area */}
      <div className="h-14 flex items-center px-4 border-b border-[var(--color-border)] justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden ml-2">
            <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md ${
              pathname.startsWith('/admin') ? 'bg-[#0047ff] shadow-[#0047ff]/20' : 
              pathname.startsWith('/editor') ? 'bg-violet-600 shadow-violet-600/30' : 
              'bg-[#ffe500] text-black shadow-[#ffe500]/20'
            }`}>
              {pathname.startsWith('/admin') ? 'A' : pathname.startsWith('/editor') ? 'E' : 'S'}
            </div>
            <span className="font-bold text-sm tracking-tight truncate">
              {pathname.startsWith('/admin') ? 'Admin Panel' : pathname.startsWith('/editor') ? 'Editor Workspace' : 'Sathyadhare'}
            </span>
          </div>
        )}
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] transition-colors ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {activeNav.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href) && item.href !== '/';
            
          const isHighlight = 'highlight' in item && item.highlight;
          
          if ('readerModeToggle' in item && item.readerModeToggle) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => { enableReaderMode(); router.push('/'); }}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3 gap-3'} py-3 rounded-xl transition-all hover:scale-[1.03] active:scale-95 ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-500 font-bold'
                        : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] font-semibold'
                    }`}
                  >
                    <item.icon size={20} className={isActive ? 'text-amber-500' : ''} />
                    {!isCollapsed && <span className="text-sm truncate">{item.name}</span>}
                  </button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          }
          
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3 gap-3'} py-3 rounded-xl transition-all hover:scale-[1.03] active:scale-95 ${
                    isHighlight 
                      ? 'bg-violet-600/15 text-violet-400 hover:bg-violet-600/25 font-bold shadow-sm'
                      : isActive
                      ? isAdminView ? 'bg-[#4f8ef7]/10 text-[#4f8ef7] font-bold shadow-sm border border-[#4f8ef7]/20 scale-[1.02]' : 'bg-[#ffe500]/10 text-[#ffe500] font-bold shadow-sm border border-[#ffe500]/20 scale-[1.02]'
                      : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] font-semibold border border-transparent'
                  }`}
                >
                  <item.icon size={20} className={
                    isHighlight ? 'text-violet-400' : isActive ? (isAdminView ? 'text-[#4f8ef7]' : 'text-[#ffe500]') : ''
                  } />
                  {!isCollapsed && <span className="text-sm truncate">{item.name}</span>}
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>{item.name}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
}

export default function DesktopSidebarWrapper(props: SidebarProps) {
  // Radix tooltip provider wrapper
  return (
    <TooltipProvider delayDuration={150}>
      <DesktopSidebar {...props} />
    </TooltipProvider>
  )
}
