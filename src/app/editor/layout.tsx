import { redirect } from 'next/navigation';
import { getCachedProfile } from '@/lib/auth/getCachedProfile';
import DashboardShell from '@/components/dashboard/DashboardShell';

export const dynamic = 'force-dynamic';

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCachedProfile();

  // 1. Not authenticated → sign-in
  if (!user) redirect('/sign-in');

  const role = profile?.role as string | undefined;

  // 2. Only editors allowed — others go to their own dashboard
  if (!role || role !== 'editor') {
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
      roleLabel="Editor Workspace"
    >
      {children}
    </DashboardShell>
  );
}
