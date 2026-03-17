/**
 * DashboardShell
 *
 * Shared layout shell rendered by the super_admin, admin, and editor
 * dashboard layouts. Composes:
 *
 *   ┌───────────────────────────────────────┐
 *   │  DashboardHeader  (fixed, 60px top)   │
 *   ├───────────────────────────────────────┤
 *   │                                       │
 *   │         {children}  (scrollable)      │
 *   │                                       │
 *   ├───────────────────────────────────────┤
 *   │  DashboardBottomNav (fixed, 60px bot) │
 *   └───────────────────────────────────────┘
 *
 * Usage (from a role-specific layout.tsx):
 *
 *   import DashboardShell from '@/components/dashboard/DashboardShell'
 *   import type { DashNavItem } from '@/components/dashboard/DashboardBottomNav'
 *   import { LayoutDashboard, FileText } from 'lucide-react'
 *
 *   const NAV_ITEMS: DashNavItem[] = [
 *     { href: '/admin',          label: 'Dashboard', icon: LayoutDashboard, exact: true },
 *     { href: '/admin/articles', label: 'Articles',  icon: FileText },
 *   ]
 *
 *   export default async function AdminDashboardLayout({ children }) {
 *     const { user, profile } = await getCachedProfile()
 *     return (
 *       <DashboardShell
 *         user={user}
 *         profile={profile}
 *         role="admin"
 *         roleLabel="Admin Dashboard"
 *         navItems={NAV_ITEMS}
 *       >
 *         {children}
 *       </DashboardShell>
 *     )
 *   }
 */

import DashboardHeader, {
  type DashboardUser,
  type DashboardProfile,
} from './DashboardHeader';

interface Props {
  children: React.ReactNode;
  user: DashboardUser | null;
  profile: DashboardProfile | null;
  /** Canonical role string, e.g. 'super_admin' | 'admin' | 'editor' */
  role: string;
  /** Human-readable label shown in the header, e.g. "Admin Dashboard" */
  roleLabel: string;
  navAccentColor?: string;
}

export default function DashboardShell({
  children,
  user,
  profile,
  role,
  roleLabel,
  navAccentColor,
}: Props) {
  const hasNav = true; // Still using this for padding, maybe check pathname

  return (
    /*
     * Full-viewport container.
     * The header and bottom nav are both `position: fixed`, so we only need
     * padding-top / padding-bottom on the scroll container to prevent content
     * from hiding behind them — matching the approach of PresenceWrapper.
     */
    <div
      className="min-h-[100svh] bg-[var(--color-background)] flex flex-col"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 60px)',
        paddingBottom: hasNav ? 'calc(env(safe-area-inset-bottom) + 60px)' : undefined,
      }}
    >
      {/* Fixed top header */}
      <DashboardHeader
        user={user}
        profile={profile}
        role={role}
        roleLabel={roleLabel}
      />

      {/* Scrollable main content area */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-4 flex flex-col gap-4 sm:gap-6">
        {children}
      </main>
    </div>
  );
}

/* Re-export types so consumers only need one import */
export type { DashboardUser, DashboardProfile };
