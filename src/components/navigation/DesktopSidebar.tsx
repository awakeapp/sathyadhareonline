'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import {
  LayoutDashboard, FileText, Users, BarChart2, MessageSquare,
  Image as ImageIcon, Layers, ScrollText, Settings, Shield,
  IndianRupee, Mail, Eye, Home, Search, Mic, SquarePen,
  PanelLeftClose, PanelLeftOpen, LucideIcon, ChevronRight,
} from 'lucide-react';
import { SA_SECTIONS, NavSection, NavSectionItem } from './nav-items';

interface SidebarProps { role?: string | null }

/* ── ADMIN sections ── */

/* ── ADMIN sections ── */
const ADMIN_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Dashboard',  href: '/admin',           icon: LayoutDashboard, exact: true },
      { label: 'Articles',   href: '/admin/articles',  icon: FileText },
    ],
  },
  {
    title: 'Content & Users',
    items: [
      { label: 'Users',     href: '/admin/users',      icon: Users        },
      { label: 'Comments',  href: '/admin/comments',   icon: MessageSquare },
      { label: 'Media',     href: '/admin/media',       icon: ImageIcon    },
      { label: 'Sequels',   href: '/admin/sequels',     icon: Layers       },
    ],
  },
  {
    items: [
      { label: 'Reader Mode', href: '/', icon: Eye, readerToggle: true },
    ],
  },
];

/* ── EDITOR sections ── */
const EDITOR_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Dashboard',   href: '/editor',               icon: LayoutDashboard, exact: true },
      { label: 'My Articles', href: '/editor/articles',      icon: FileText },
      { label: 'Write',       href: '/editor/articles/new',  icon: SquarePen, highlight: true },
    ],
  },
  {
    items: [
      { label: 'Reader Mode', href: '/', icon: Eye, readerToggle: true },
    ],
  },
];

/* ── READER items ── */
const READER_ITEMS: NavSectionItem[] = [
  { label: 'Home',    href: '/',        icon: Home,   exact: true  },
  { label: 'Sequels', href: '/sequels', icon: Layers               },
  { label: 'Search',  href: '/search',  icon: Search               },
  { label: 'Podcast', href: '/podcast', icon: Mic                  },
];

/* ── Icon accent colors per section ── */
const SA_ACCENT_MAP: Record<string, string> = {
  '/admin/users':      '#a78bfa',
  '/admin/analytics':  '#60a5fa',
  '/admin/comments':   '#34d399',
  '/admin/media':      '#f472b6',
  '/admin/sequels':     '#fb923c',
  '/admin/audit-logs': '#c084fc',
  '/admin/settings':   '#94a3b8',
  '/admin/newsletter': '#60a5fa',
  '/admin/security':   '#f87171',
  '/admin/financial':  '#34d399',
};

/* ═══════════════════════════════════════════════════════════════════
   Sidebar component
═══════════════════════════════════════════════════════════════════ */
function DesktopSidebar({ role }: SidebarProps) {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isAuthPage   = pathname === '/login' || pathname === '/signup';
  const isPrivileged = role === 'super_admin' || role === 'admin' || role === 'editor';
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/editor');

  // ⚠️ NOTE: isAdminView does NOT depend on reader mode state.
  // Even if reader mode is active in localStorage, privileged users on /admin
  // must see the admin sidebar. Reader mode only affects reader-facing pages.
  const isAdminView  = isAdminRoute && isPrivileged;

  if (isAuthPage) return null;

  let sections: NavSection[] = [];
  let accentColor = '#4f8ef7';
  let brandLabel  = 'Sathyadhare';
  let brandAbbr   = 'S';
  let brandBg     = '#ffe500';
  let brandColor  = '#000';

  if (isAdminView) {
    if (role === 'super_admin') {
      sections    = SA_SECTIONS;
      accentColor = '#7c3aed';
      brandLabel  = 'Super Admin';
      brandAbbr   = 'SA';
      brandBg     = '#7c3aed';
      brandColor  = '#fff';
    } else if (role === 'admin') {
      sections    = ADMIN_SECTIONS;
      accentColor = '#0047ff';
      brandLabel  = 'Admin Panel';
      brandAbbr   = 'A';
      brandBg     = '#0047ff';
      brandColor  = '#fff';
    } else {
      sections    = EDITOR_SECTIONS;
      accentColor = '#6d28d9';
      brandLabel  = 'Editor';
      brandAbbr   = 'E';
      brandBg     = '#7c3aed';
      brandColor  = '#fff';
    }
  }

  const handleReaderSwitch = () => {
    try {
      const dashUrl   = role === 'editor' ? '/editor' : '/admin';
      const dashLabel = role === 'super_admin' ? 'Super Admin Dashboard'
                      : role === 'admin'       ? 'Admin Dashboard'
                      :                          'Editor Dashboard';
      const col       = role === 'super_admin' ? '#7c3aed'
                      : role === 'admin'       ? '#0047ff' : '#6d28d9';
      localStorage.setItem('sathyadhare:readerMode',     'true');
      localStorage.setItem('sathyadhare:dashboardUrl',   dashUrl);
      localStorage.setItem('sathyadhare:dashboardLabel', dashLabel);
      localStorage.setItem('sathyadhare:dashboardColor', col);
      document.cookie = `sathyadhare:readerMode=true; path=/; max-age=31536000`;
    } catch { /* ignore */ }
    window.location.href = '/';
  };

  /* ── Render one nav item ── */
  const renderItem = (item: NavSectionItem, idx: number) => {
    const isActive = item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href) && item.href !== '/';

    const itemAccent = SA_ACCENT_MAP[item.href] || accentColor;
    const isHighlight = item.highlight;

    const baseClass = `
      w-full flex items-center rounded-xl transition-all duration-100 active:scale-[0.98]
      ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5 gap-3'}
      text-sm font-semibold border
      ${isHighlight
        ? 'border-violet-500/20 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
        : isActive
          ? 'border-transparent font-bold'
          : 'border-transparent text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
      }
    `;

    const activeStyle = isActive && !isHighlight ? {
      background: `${itemAccent}15`,
      color: itemAccent,
      borderColor: `${itemAccent}25`,
    } : {};

    const inner = (
      <>
        <item.icon size={18} />
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <span className="truncate block">{item.label}</span>
            {item.sub && !isActive && (
              <span className="text-[10px] font-semibold block truncate opacity-60">{item.sub}</span>
            )}
          </div>
        )}
        {!collapsed && isActive && !item.readerToggle && (
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: itemAccent }} />
        )}
      </>
    );

    const content = item.readerToggle ? (
      <button key={idx} className={baseClass} style={activeStyle} onClick={handleReaderSwitch}>
        {inner}
      </button>
    ) : (
      <Link key={idx} href={item.href} prefetch={true} className={baseClass} style={activeStyle}>
        {inner}
      </Link>
    );

    return (
      <Tooltip key={item.href + idx}>
        <TooltipTrigger asChild>
          <div>{content}</div>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right"><p>{item.label}</p></TooltipContent>
        )}
      </Tooltip>
    );
  };

  return (
    <aside
      data-debug-role={role}
      className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-300 border-r sticky top-0 h-screen overflow-hidden
        ${collapsed ? 'w-[68px]' : 'w-64'}
        ${isAdminView
          ? 'backdrop-blur-2xl bg-[var(--color-surface)]/80 dark:bg-[#0f0e17]/80 border-[var(--color-border)]'
          : 'backdrop-blur-2xl bg-[var(--color-background)]/80 dark:bg-[#0f0e17]/80 border-[var(--color-border)]'
        }
      `}
    >
      {/* ── Brand header ── */}
      <div className="h-14 flex items-center px-3 gap-2.5 border-b border-[var(--color-border)] flex-shrink-0 justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className="w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center font-black text-[11px] shadow-md"
              style={{ background: brandBg, color: brandColor, boxShadow: `0 2px 12px ${brandBg}50` }}
            >
              {brandAbbr}
            </div>
            <span className="font-bold text-sm tracking-tight truncate">{brandLabel}</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-8 h-8 rounded-xl flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* ── Nav body ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {isAdminView ? (
          sections.map((section, sIdx) => (
            <div key={sIdx} className={sIdx > 0 ? 'mt-4' : ''}>
              {/* Section divider */}
              {section.title && !collapsed && (
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-muted)] px-3 py-1 mb-0.5 opacity-70">
                  {section.title}
                </p>
              )}
              {section.title && collapsed && (
                <div className="my-2 mx-2 border-t border-[var(--color-border)]" />
              )}
              {section.items.map((item, iIdx) => renderItem(item, sIdx * 100 + iIdx))}
            </div>
          ))
        ) : (
          READER_ITEMS.map((item, idx) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <div>
                    <Link
                      href={item.href}
                      className={`w-full flex items-center rounded-xl transition-all border
                        ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5 gap-3'}
                        text-sm font-semibold
                        ${isActive
                          ? 'border-[#ffe500]/20 font-bold'
                          : 'border-transparent text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
                        }
                      `}
                      style={isActive ? { background: '#ffe50015', color: '#ffe500', borderColor: '#ffe50025' } : {}}
                    >
                      <item.icon size={18} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </div>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right"><p>{item.label}</p></TooltipContent>}
              </Tooltip>
            );
          })
        )}
      </nav>
    </aside>
  );
}

export default function DesktopSidebarWrapper(props: SidebarProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <DesktopSidebar {...props} />
    </TooltipProvider>
  );
}
