/**
 * Admin nav items — used by AdminLayout to wire the DashboardShell bottom nav.
 *
 * 5 tabs (mobile-first; icons are 24px lucide):
 *   Home     → /admin           (overview + recent activity)
 *   Content  → /admin/content   (articles, sequels, library, friday, categories)
 *   Editors  → /admin/editors   (editor list, workload, assignment)
 *   Inbox    → /admin/inbox     (submissions queue + SA notifications)
 *   Comments → /admin/comments  (moderation queue)
 */
// No longer importing icons here, using string names for serialization safety.
import type { DashNavItem } from '@/components/dashboard/DashboardBottomNav';

export const ADMIN_NAV_ITEMS: DashNavItem[] = [
  {
    href:  '/admin',
    label: 'Home',
    icon:  'LayoutDashboard',
    exact: true,
  },
  {
    href:  '/admin/content',
    label: 'Content',
    icon:  'FolderOpen',
  },
  {
    href:  '/admin/editors',
    label: 'Editors',
    icon:  'PenLine',
  },
  {
    href:  '/admin/inbox',
    label: 'Inbox',
    icon:  'Inbox',
  },
  {
    href:  '/admin/comments',
    label: 'Comments',
    icon:  'MessageSquare',
  },
];

// Super Admin additions

export const SUPER_ADMIN_NAV_ITEMS: DashNavItem[] = [
  {
    href:  '/admin',
    label: 'Home',
    icon:  'LayoutDashboard',
    exact: true,
  },
  {
    href:  '/admin/manage',
    label: 'Manage',
    icon:  'Users',
  },
  {
    href:  '/admin/content',
    label: 'Content',
    icon:  'FolderOpen',
  },
  {
    href:  '/admin/inbox',
    label: 'Inbox',
    icon:  'Inbox',
  },
  {
    href:  '/admin/settings',
    label: 'Settings',
    icon:  'Settings',
  },
];
