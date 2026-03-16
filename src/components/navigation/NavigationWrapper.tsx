'use client';

import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomNav from './MobileBottomNav';

interface NavigationWrapperProps {
  user?: User | null;
  role?: string | null;
}

export default function NavigationWrapper({ user, role }: NavigationWrapperProps) {
  const pathname = usePathname();
  const authPaths = ['/login', '/signup', '/forgot-password', '/update-password', '/terms'];
  const isAuthPage = authPaths.includes(pathname);

  if (isAuthPage) return null;

  return (
    <>
      <DesktopSidebar role={role} />
      <MobileBottomNav role={role} />
    </>
  );
}
