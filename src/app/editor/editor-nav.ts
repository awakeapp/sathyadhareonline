/**
 * Editor nav items — used by EditorLayout to wire the DashboardShell bottom nav.
 *
 * 4 tabs:
 *   Home    → /editor                   (exact — overview + recent activity)
 *   My Work → /editor/articles          (exact — all assigned content)
 *   Write   → /editor/articles/new      (active on new + [id]/edit)
 *   Updates → /editor/notifications     (admin assignments, feedback)
 */
import {
  LayoutDashboard,
  FileText,
  PenLine,
  Bell,
} from 'lucide-react';
import type { DashNavItem } from '@/components/dashboard/DashboardBottomNav';

export const EDITOR_NAV_ITEMS: DashNavItem[] = [
  {
    href:  '/editor',
    label: 'Home',
    icon:  LayoutDashboard,
    exact: true,                // only active on exact /editor
  },
  {
    href:  '/editor/articles',
    label: 'My Work',
    icon:  FileText,
    exact: true,                // exact match — write/edit sub-routes belong to Write tab
  },
  {
    href:  '/editor/articles/new',
    label: 'Write',
    icon:  PenLine,
    // Active on new-article page AND any [id]/edit route
    matchPrefixes: ['/editor/articles/new', '/editor/articles/'],
    excludePrefixes: ['/editor/articles'],   // exclude the exact list URL
  },
  {
    href:  '/editor/notifications',
    label: 'Updates',
    icon:  Bell,
  },
];
