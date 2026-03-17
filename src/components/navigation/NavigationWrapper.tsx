'use client';

import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomNav from './MobileBottomNav';
import DashboardBottomNav from '@/components/dashboard/DashboardBottomNav';
import { ADMIN_NAV_ITEMS, SUPER_ADMIN_NAV_ITEMS } from '@/app/admin/admin-nav';
import { EDITOR_NAV_ITEMS } from '@/app/editor/editor-nav';

interface NavigationWrapperProps {
  user?: User | null;
  role?: string | null;
}

export default function NavigationWrapper({ user, role }: NavigationWrapperProps) {
  const pathname = usePathname();
  const authPaths = ['/login', '/signup', '/forgot-password', '/update-password', '/terms'];
  const isAuthPage = authPaths.includes(pathname);
  const isAdminPage = pathname.startsWith('/admin') || pathname.startsWith('/editor');

  if (isAuthPage) return null;

  if (isAdminPage) {
    // Determine which nav items to show based on role and path
    const isEditor = pathname.startsWith('/editor');
    const items = isEditor 
      ? EDITOR_NAV_ITEMS 
      : (role === 'super_admin' ? SUPER_ADMIN_NAV_ITEMS : ADMIN_NAV_ITEMS);

    return (
      <DashboardBottomNav items={items} />
    );
  }

  return (
    <>
      <DesktopSidebar role={role} />
      <MobileBottomNav role={role} />
    </>
  );
}
