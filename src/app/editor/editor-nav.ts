'use client';

/**
 * Editor nav items — used by EditorLayout to wire the DashboardShell bottom nav.
 *
 * 4 tabs:
 *   Home    → /editor                   (exact — overview + recent activity)
 *   My Work → /editor/articles          (exact — all assigned content)
 *   Write   → /editor/articles/new      (active on new + [id]/edit)
 *   Updates → /editor/notifications     (admin assignments, feedback)
 */
// No unnecessary imports
import type { DashNavItem } from '@/components/dashboard/DashboardBottomNav';

export const EDITOR_NAV_ITEMS: DashNavItem[] = [
  {
    href:  '/editor',
    label: 'Home',
    icon:  'LayoutDashboard',
    exact: true,
  },
  {
    href:  '/editor/articles',
    label: 'My Work',
    icon:  'FileText',
    exact: true,
  },
  {
    href:  '/editor/articles/new',
    label: 'Write',
    icon:  'PenLine',
    matchPrefixes: ['/editor/articles/new', '/editor/articles/'],
    excludePrefixes: ['/editor/articles'],
  },
  {
    href:  '/editor/notifications',
    label: 'Updates',
    icon:  'Bell',
  },
];
