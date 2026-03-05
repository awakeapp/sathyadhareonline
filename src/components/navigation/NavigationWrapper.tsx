import type { User } from '@supabase/supabase-js';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomNav from './MobileBottomNav';

interface NavigationWrapperProps {
  user?: User | null;
  role?: string | null;
}

export default function NavigationWrapper({ user, role }: NavigationWrapperProps) {
  return (
    <>
      <DesktopSidebar role={role} />
      <MobileBottomNav role={role} />
    </>
  );
}
