'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useReaderMode } from '@/context/ReaderModeContext';
import {
  LayoutDashboard, FileText, Users, MessageSquare,
  Layers, Eye, Home, Search, Mic, Menu,
  SquarePen, SlidersHorizontal,
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

  const isAuthPage  = pathname === '/login' || pathname === '/signup';
  const isPrivileged = role === 'super_admin' || role === 'admin' || role === 'editor';
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/editor');
  const isAdminView  = isAdminRoute && isPrivileged;

  if (isAuthPage) return null;

  /* ──────────────────────────────────────────────────────────────
     SUPER ADMIN — 4-tab Meta Business style nav
  ────────────────────────────────────────────────────────────── */
  if (isAdminView && role === 'super_admin') {
    // Manage tab is active when on /admin/manage OR any section it links to
    const manageGroupPaths = [
      '/admin/manage', '/admin/users', '/admin/analytics',
      '/admin/comments', '/admin/media', '/admin/categories',
      '/admin/sequels', '/admin/audit-logs', '/admin/submissions',
    ];
    const moreGroupPaths = [
      '/admin/more', '/admin/settings', '/admin/email-templates',
      '/admin/security', '/admin/financial', '/admin/newsletter',
      '/admin/trash', '/admin/friday',
    ];
    const isManageActive = manageGroupPaths.some(p =>
      p === '/admin/manage' ? pathname === p || pathname.startsWith(p + '/') : pathname.startsWith(p)
    );
    const isMoreActive = moreGroupPaths.some(p =>
      p === '/admin/more' ? pathname === p || pathname.startsWith(p + '/') : pathname.startsWith(p)
    );

    return (
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/80 dark:bg-[#0f0e17]/80"
        style={{
          borderTop: '1px solid var(--color-border)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-stretch h-[65px] px-2 pb-[env(safe-area-inset-bottom)]">
          {/* Tab 1 — Dashboard */}
          <NavTabLink
            href="/admin"
            icon={LayoutDashboard}
            label="Dashboard"
            active={pathname === '/admin'}
          />

          {/* Tab 2 — Articles */}
          <NavTabLink
            href="/admin/articles"
            icon={FileText}
            label="Articles"
            active={pathname.startsWith('/admin/articles')}
          />

          {/* Tab 3 — Manage (dedicated page) */}
          <NavTabLink
            href="/admin/manage"
            icon={SlidersHorizontal}
            label="Manage"
            active={isManageActive}
          />

          {/* Tab 4 — More (dedicated page) */}
          <NavTabLink
            href="/admin/more"
            icon={Menu}
            label="More"
            active={isMoreActive}
          />

          {/* Tab 5 — Reader Mode */}
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
     REGULAR ADMIN nav
  ────────────────────────────────────────────────────────────── */
  if (isAdminView && role === 'admin') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/80 dark:bg-[#0f0e17]/80"
        style={{ borderTop: '1px solid var(--color-border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch h-16 px-2">
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
        <div className="flex items-stretch h-16 px-2">
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
      <div className="flex items-stretch h-16 px-2">
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
      <div className="relative">
        <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className="text-[10px] font-semibold tracking-wide">{label}</span>
    </Link>
  );
}
