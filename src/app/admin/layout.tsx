import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  let profile = null;
  try {
    const { data: p } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    profile = p;
  } catch (e) {
    console.error('Admin layout fetching error:', e);
  }

  const role = profile?.role;

  // Route protection — two distinct cases:
  // 1. Not authenticated at all → send to login
  // 2. Authenticated but wrong role → send to reader home (not /login, to avoid re-auth loop)
  if (!role || (role !== 'admin' && role !== 'super_admin')) {
    redirect('/');
  }

  return (
    <div className="flex-1 w-full bg-[var(--color-background)]">
      <div className="w-full max-w-[1400px] mx-auto min-h-screen">
        {children}
      </div>
    </div>
  );
}
