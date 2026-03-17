import { redirect } from 'next/navigation';
import { getCachedProfile } from '@/lib/auth/getCachedProfile';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { ADMIN_NAV_ITEMS, SUPER_ADMIN_NAV_ITEMS } from './admin-nav';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCachedProfile();

  // 1. Not authenticated → sign-in
  if (!user) redirect('/sign-in');

  const role = profile?.role as string | undefined;

  // 2. Wrong role → own dashboard (avoids re-auth loop)
  if (!role || (role !== 'admin' && role !== 'super_admin')) {
    redirect('/');
  }

  return (
    <DashboardShell
      user={{
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      }}
      profile={{
        full_name:  profile?.full_name  ?? null,
        avatar_url: profile?.avatar_url ?? null,
        role:       role,
      }}
      role={role}
      roleLabel={role === 'super_admin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}
      navItems={role === 'super_admin' ? SUPER_ADMIN_NAV_ITEMS : ADMIN_NAV_ITEMS}
    >
      {children}
    </DashboardShell>
  );
}
