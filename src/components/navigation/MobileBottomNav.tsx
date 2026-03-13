'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useReaderMode } from '@/context/ReaderModeContext';
import {
  LayoutDashboard, FileText, Users, MessageSquare,
  Layers, Eye, Home, Search, Mic, Menu,
  SquarePen, SlidersHorizontal, PlusCircle, BarChart2,
  Image as ImageIcon, Library, X
} from 'lucide-react';

interface MobileBottomNavProps {
  role?: string | null;
}

/* ═══════════════════════════════════════════════════════════════════
   Super Admin 4-tab spec:
   Dashboard  → /admin
   Articles   → /admin/articles
   Manage     → /admin/manage  (dedicated landing page)
   More       → /admin/more    (dedicated landing page)
═══════════════════════════════════════════════════════════════════ */


/* ── Main component ──────────────────────────────────────────────── */
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
     SUPER ADMIN — 4-tab Meta Business style nav
  ────────────────────────────────────────────────────────────── */
  if (isAdminView && role === 'super_admin') {
    const isContentActive = pathname.startsWith('/admin/articles') || pathname.startsWith('/admin/media');
    const isAnalyticsActive = pathname.startsWith('/admin/analytics');
    const isMoreActive = pathname.startsWith('/admin/more') || pathname.startsWith('/admin/settings');

    return (
      <>
        {/* Create Quick Action Panel (Modal) */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/60 backdrop-blur-sm"
               onClick={() => setIsCreateOpen(false)}>
            <div className="bg-[var(--color-surface)] rounded-t-2xl w-full max-w-[430px] mx-auto overflow-hidden animate-slide-up"
                 style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
                 onClick={(e) => e.stopPropagation()}>
              
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                <h3 className="text-[17px] font-bold text-[var(--color-text)]">Create Quick Action</h3>
                <button onClick={() => setIsCreateOpen(false)} className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)]">
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4">
                <Link href="/admin/articles/new" onClick={() => setIsCreateOpen(false)} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-primary)] hover:text-white transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] group-hover:border-[var(--color-primary)] flex items-center justify-center group-hover:text-[var(--color-primary)]">
                    <SquarePen size={20} strokeWidth={1.5} />
                  </div>
                  <span className="text-[14px] font-medium text-[var(--color-text)] group-hover:text-white">Article</span>
                </Link>

                <Link href="/admin/media" onClick={() => setIsCreateOpen(false)} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-primary)] hover:text-white transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] group-hover:border-[var(--color-primary)] flex items-center justify-center group-hover:text-[var(--color-primary)]">
                    <ImageIcon size={20} strokeWidth={1.5} />
                  </div>
                  <span className="text-[14px] font-medium text-[var(--color-text)] group-hover:text-white">Media</span>
                </Link>

                <Link href="/admin/users?action=new-author" onClick={() => setIsCreateOpen(false)} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-primary)] hover:text-white transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] group-hover:border-[var(--color-primary)] flex items-center justify-center group-hover:text-[var(--color-primary)]">
                    <Users size={20} strokeWidth={1.5} />
                  </div>
                  <span className="text-[14px] font-medium text-[var(--color-text)] group-hover:text-white">Author</span>
                </Link>

                <Link href="/admin/categories" onClick={() => setIsCreateOpen(false)} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-primary)] hover:text-white transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] group-hover:border-[var(--color-primary)] flex items-center justify-center group-hover:text-[var(--color-primary)]">
                    <Library size={20} strokeWidth={1.5} />
                  </div>
                  <span className="text-[14px] font-medium text-[var(--color-text)] group-hover:text-white">Category</span>
                </Link>
              </div>

            </div>
          </div>
        )}

        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)]/95 backdrop-blur-xl"
          style={{
            borderTop: '1px solid var(--color-border)',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.04)',
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          {/* Target minimum 48px tap heights */}
          <div className="flex items-stretch h-[60px] px-2 max-w-[430px] mx-auto">
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
              className="flex-1 flex flex-col items-center justify-center gap-[2px] h-full active:scale-90 focus:outline-none"
              style={{ color: 'var(--color-text)' }}>
              <PlusCircle size={32} strokeWidth={1.5} className="text-[var(--color-primary)]" />
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
          </div>
        </nav>
      </>
    );
  }

  /* ──────────────────────────────────────────────────────────────
     REGULAR ADMIN nav
  ────────────────────────────────────────────────────────────── */
  if (isAdminView && role === 'admin') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/80 dark:bg-[#0f0e17]/80"
        style={{ borderTop: '1px solid var(--color-border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch h-[60px] px-2">
          {[
            { label: 'Dashboard', href: '/admin',          icon: LayoutDashboard, exact: true  },
            { label: 'Articles',  href: '/admin/articles', icon: FileText,        exact: false },
            { label: 'Comments',  href: '/admin/comments', icon: MessageSquare,   exact: false },
            { label: 'Users',     href: '/admin/users',    icon: Users,           exact: false },
          ].map(tab => (
            <NavTabLink key={tab.href} href={tab.href} icon={tab.icon} label={tab.label}
              active={tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)} />
          ))}
          <button onClick={() => { enableReaderMode(); window.location.href = '/'; }}
            className="flex-1 flex flex-col items-center justify-center gap-1 h-full active:scale-90 focus:outline-none"
            style={{ color: 'var(--color-muted)' }}>
            <Eye size={22} /><span className="text-[10px] font-bold">Reader</span>
          </button>
        </div>
      </nav>
    );
  }

  /* ──────────────────────────────────────────────────────────────
     EDITOR nav
  ────────────────────────────────────────────────────────────── */
  if (isAdminView && role === 'editor') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/80 dark:bg-[#0f0e17]/80"
        style={{ borderTop: '1px solid var(--color-border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch h-[60px] px-2">
          {[
            { label: 'Dashboard', href: '/editor',               icon: LayoutDashboard, exact: true  },
            { label: 'Articles',  href: '/editor/articles',      icon: FileText,        exact: false },
            { label: 'Write',     href: '/editor/articles/new',  icon: SquarePen,       exact: false },
          ].map(tab => (
            <NavTabLink key={tab.href} href={tab.href} icon={tab.icon} label={tab.label}
              active={tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)} />
          ))}
          <button onClick={() => { enableReaderMode(); window.location.href = '/'; }}
            className="flex-1 flex flex-col items-center justify-center gap-1 h-full active:scale-90 focus:outline-none"
            style={{ color: 'var(--color-muted)' }}>
            <Eye size={22} /><span className="text-[10px] font-bold">Reader</span>
          </button>
        </div>
      </nav>
    );
  }

  /* ──────────────────────────────────────────────────────────────
     READER / GUEST nav
  ────────────────────────────────────────────────────────────── */
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/80 dark:bg-[#0f0e17]/80"
      style={{ borderTop: '1px solid var(--color-border)', paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -2px 20px rgba(0,0,0,0.08)' }}>
      <div className="flex items-stretch h-[60px] px-2">
        {[
          { label: 'Home',    href: '/',        icon: Home,   exact: true  },
          { label: 'Sequels', href: '/sequels', icon: Layers, exact: false },
          { label: 'Search',  href: '/search',  icon: Search, exact: false },
          { label: 'Podcast', href: '/podcast', icon: Mic,    exact: false },
        ].map(tab => (
          <NavTabLink key={tab.href} href={tab.href} icon={tab.icon} label={tab.label}
            active={tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)}
            accentColor="#ffe500" />
        ))}
        <button
          onClick={() => window.dispatchEvent(new Event('toggle-drawer'))}
          className="flex-1 flex flex-col items-center justify-center gap-1 h-full active:scale-90 focus:outline-none"
          style={{ color: 'var(--color-muted)' }}
        >
          <Menu size={22} /><span className="text-[10px] font-bold">More</span>
        </button>
      </div>
    </nav>
  );
}

/* ── Helper: Link-based tab (shared) ─────────────────────────────── */
function NavTabLink({
  href, icon: Icon, label, active, accentColor = '#a78bfa', onTap,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  active?: boolean;
  accentColor?: string;
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
      className="relative flex-1 flex flex-col items-center justify-center gap-[2px] h-full transition-all duration-75 active:scale-[0.85] active:opacity-70 focus:outline-none select-none tap-highlight-none"
      style={{ color: active ? accentColor : 'var(--color-muted)' }}
    >
      <div className="relative flex items-center justify-center w-full">
        <Icon size={24} strokeWidth={active ? 2.5 : 1.5} />
      </div>
      <span className="text-[11px] font-medium tracking-wide leading-none select-none">{label}</span>
    </Link>
  );
}
