/**
 * @/components/dashboard — barrel index
 *
 * Primary export: DashboardShell (the full layout wrapper)
 * Secondary: individual pieces for advanced composition
 */
export { default as DashboardShell } from './DashboardShell';
export { default as DashboardHeader } from './DashboardHeader';
export { default as DashboardBottomNav } from './DashboardBottomNav';

export type { DashNavItem, DashboardUser, DashboardProfile } from './DashboardShell';
