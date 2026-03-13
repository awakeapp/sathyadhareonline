'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useReaderMode } from '@/context/ReaderModeContext';
import {
  LayoutDashboard, FileText, Users, MessageSquare,
  Layers, Eye, Home, Search, Mic, Menu,
  SquarePen, PlusCircle, BarChart2,
  Image as ImageIcon, Library, X
} from 'lucide-react';

interface MobileBottomNavProps {
  role?: string | null;
}

/* ═══════════════════════════════════════════════════════════════════
   Floating Bottom Nav (Island / Pill style)
═══════════════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────────────
   Wrapper for Floating Nav Background / Shadow
────────────────────────────────────────────────────────────── */
const FloatingContainer = ({ children }: { children: React.ReactNode }) => (
  <nav
    className="md:hidden fixed z-[90] left-0 right-0 mx-auto px-4"
    style={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
  >
    <div 
      className="bg-white/85 dark:bg-[#121215]/85 backdrop-blur-[24px] saturate-[1.8] border border-black/5 dark:border-white/10 shadow-[0_16px_40px_-5px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_40px_-5px_rgba(0,0,0,0.5)] rounded-[2rem] max-w-[400px] mx-auto overflow-hidden"
    >
      <div className="flex items-center justify-between h-[64px] px-2 sm:px-4 relative w-full">
        {children}
      </div>
    </div>
  </nav>
);

export default function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { enableReaderMode } = useReaderMode();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isAuthPage  = pathname === '/login' || pathname === '/signup';
  const isPrivileged = role === 'super_admin' || role === 'admin' || role === 'editor';
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/editor');
  const isAdminView  = isAdminRoute && isPrivileged;

  if (isAuthPage) return null;



  /* ──────────────────────────────────────────────────────────────
     SUPER ADMIN — 4-tab + Create Floating Nav
  ────────────────────────────────────────────────────────────── */
  if (isAdminView && role === 'super_admin') {
    const isContentActive = pathname.startsWith('/admin/articles') || pathname.startsWith('/admin/media');
    const isAnalyticsActive = pathname.startsWith('/admin/analytics');
    const isMoreActive = pathname.startsWith('/admin/more') || pathname.startsWith('/admin/settings');

    return (
      <>
        {/* Create Quick Action Panel (Modal) */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm"
               onClick={() => setIsCreateOpen(false)}>
            <div className="bg-[var(--color-surface)] rounded-t-3xl w-full max-w-[430px] mx-auto overflow-hidden animate-slide-up shadow-2xl"
                 style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
                 onClick={(e) => e.stopPropagation()}>
              
              <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
                <h3 className="text-[18px] font-bold text-[var(--color-text)]">Create Quick Action</h3>
                <button onClick={() => setIsCreateOpen(false)} className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-border)] transition-colors">
                  <X size={20} strokeWidth={2} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 p-5">
                <Link href="/admin/articles/new" onClick={() => setIsCreateOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-surface-2)] hover:bg-[var(--color-primary)] hover:text-white transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-surface)] shadow-sm flex items-center justify-center text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                    <SquarePen size={22} strokeWidth={1.5} />
                  </div>
                  <span className="text-[15px] font-bold text-[var(--color-text)] group-hover:text-white">Article</span>
                </Link>

                <Link href="/admin/media" onClick={() => setIsCreateOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-surface-2)] hover:bg-[var(--color-primary)] hover:text-white transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-surface)] shadow-sm flex items-center justify-center text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                    <ImageIcon size={22} strokeWidth={1.5} />
                  </div>
                  <span className="text-[15px] font-bold text-[var(--color-text)] group-hover:text-white">Media</span>
                </Link>

                <Link href="/admin/users?action=new-author" onClick={() => setIsCreateOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-surface-2)] hover:bg-[var(--color-primary)] hover:text-white transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-surface)] shadow-sm flex items-center justify-center text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                    <Users size={22} strokeWidth={1.5} />
                  </div>
                  <span className="text-[15px] font-bold text-[var(--color-text)] group-hover:text-white">Author</span>
                </Link>

                <Link href="/admin/categories" onClick={() => setIsCreateOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-surface-2)] hover:bg-[var(--color-primary)] hover:text-white transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-surface)] shadow-sm flex items-center justify-center text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                    <Library size={22} strokeWidth={1.5} />
                  </div>
                  <span className="text-[15px] font-bold text-[var(--color-text)] group-hover:text-white">Category</span>
                </Link>
              </div>

            </div>
          </div>
        )}

        <FloatingContainer>
          <NavTabLink
            href="/admin"
            icon={LayoutDashboard}
            label="Dashboard"
            active={pathname === '/admin'}
            accentColor="var(--color-primary)"
          />

          <NavTabLink
            href="/admin/articles"
            icon={FileText}
            label="Content"
            active={isContentActive}
            accentColor="var(--color-primary)"
          />

          {/* Create Trigger */}
          <button onClick={() => setIsCreateOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 active:scale-90 focus:outline-none transition-transform"
            style={{ color: 'var(--color-text)' }}>
            <PlusCircle size={36} strokeWidth={1.25} className="text-[var(--color-primary)] drop-shadow-[0_4px_10px_rgba(79,70,229,0.3)]" />
          </button>

          <NavTabLink
            href="/admin/analytics"
            icon={BarChart2}
            label="Analytics"
            active={isAnalyticsActive}
            accentColor="var(--color-primary)"
          />

          <NavTabLink
            href="/admin/more"
            icon={Menu}
            label="More"
            active={isMoreActive}
            accentColor="var(--color-primary)"
          />
        </FloatingContainer>
      </>
    );
  }

  /* ──────────────────────────────────────────────────────────────
     REGULAR ADMIN nav
  ────────────────────────────────────────────────────────────── */
  if (isAdminView && role === 'admin') {
    return (
      <FloatingContainer>
        {[
          { label: 'Dash',      href: '/admin',          icon: LayoutDashboard, exact: true  },
          { label: 'Articles',  href: '/admin/articles', icon: FileText,        exact: false },
          { label: 'Comments',  href: '/admin/comments', icon: MessageSquare,   exact: false },
          { label: 'Users',     href: '/admin/users',    icon: Users,           exact: false },
        ].map(tab => (
          <NavTabLink key={tab.href} href={tab.href} icon={tab.icon} label={tab.label}
            active={tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)} />
        ))}
        <button onClick={() => { enableReaderMode(); window.location.href = '/'; }}
          className="flex-1 flex flex-col items-center justify-center gap-1 active:scale-95 focus:outline-none transition-transform"
          style={{ color: 'var(--color-muted)' }}>
          <div className="relative flex items-center justify-center w-[48px] h-[32px] rounded-full transition-colors duration-200">
             <Eye size={22} strokeWidth={1.75} />
          </div>
          <span className="text-[10px] font-bold tracking-wide">Reader</span>
        </button>
      </FloatingContainer>
    );
  }

  /* ──────────────────────────────────────────────────────────────
     EDITOR nav
  ────────────────────────────────────────────────────────────── */
  if (isAdminView && role === 'editor') {
    return (
      <FloatingContainer>
        {[
          { label: 'Dashboard', href: '/editor',               icon: LayoutDashboard, exact: true  },
          { label: 'Articles',  href: '/editor/articles',      icon: FileText,        exact: false },
          { label: 'Write',     href: '/editor/articles/new',  icon: SquarePen,       exact: false },
        ].map(tab => (
          <NavTabLink key={tab.href} href={tab.href} icon={tab.icon} label={tab.label}
            active={tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)} />
        ))}
        <button onClick={() => { enableReaderMode(); window.location.href = '/'; }}
          className="flex-1 flex flex-col items-center justify-center gap-1 active:scale-95 focus:outline-none transition-transform"
          style={{ color: 'var(--color-muted)' }}>
          <div className="relative flex items-center justify-center w-[48px] h-[32px] rounded-full transition-colors duration-200">
            <Eye size={22} strokeWidth={1.75} />
          </div>
          <span className="text-[10px] font-bold tracking-wide">Reader</span>
        </button>
      </FloatingContainer>
    );
  }

  /* ──────────────────────────────────────────────────────────────
     READER / GUEST nav
  ────────────────────────────────────────────────────────────── */
  return (
    <FloatingContainer>
      {[
        { label: 'Home',    href: '/',        icon: Home,   exact: true  },
        { label: 'Sequels', href: '/sequels', icon: Layers, exact: false },
        { label: 'Search',  href: '/search',  icon: Search, exact: false },
        { label: 'Podcast', href: '/podcast', icon: Mic,    exact: false },
      ].map(tab => (
        <NavTabLink key={tab.href} href={tab.href} icon={tab.icon} label={tab.label}
          active={tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)}
          accentColor="var(--color-text)" 
          activeStyle="badge" />
      ))}
      <button
        onClick={() => window.dispatchEvent(new Event('toggle-drawer'))}
        className="flex-1 flex flex-col items-center justify-center gap-1 active:scale-95 focus:outline-none transition-transform"
        style={{ color: 'var(--color-muted)' }}
      >
        <div className="relative flex items-center justify-center w-[48px] h-[32px] rounded-full transition-colors duration-200">
           <Menu size={22} strokeWidth={1.75} />
        </div>
        <span className="text-[10px] font-bold tracking-wide">More</span>
      </button>
    </FloatingContainer>
  );
}

/* ── Helper: Floating Tab Link ─────────────────────────────── */
function NavTabLink({
  href, icon: Icon, label, active, accentColor = 'var(--color-primary)', activeStyle = "color", onTap,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  active?: boolean;
  accentColor?: string;
  activeStyle?: "color" | "badge";
  onTap?: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch={true}
      onClick={() => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('transition_type', 'slide-up');
          if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
          }
        }
        if (onTap) onTap();
      }}
      className="relative flex-1 flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 focus:outline-none select-none tap-highlight-none group"
      style={{ color: active && activeStyle === 'color' ? accentColor : 'var(--color-muted)' }}
    >
      <div 
        className={`relative flex items-center justify-center w-[48px] h-[32px] rounded-full transition-all duration-300 ${active && activeStyle === 'badge' ? 'bg-[#ffe500]/20 text-[#ffe500] dark:bg-[#ffe500]/10 dark:text-[#ffe500]' : ''}`}
      >
        <Icon size={22} strokeWidth={active ? 2.5 : 1.75} className={`transition-all duration-300 ${active && activeStyle === 'badge' ? 'text-[#ffe500]' : ''}`} />
      </div>
      <span className={`text-[10px] font-bold tracking-wide leading-none select-none transition-colors duration-300 ${active && activeStyle === 'badge' ? 'text-[var(--color-text)]' : ''}`}>
        {label}
      </span>
    </Link>
  );
}
