import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SecurityClient from './SecurityClient';

export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'super_admin') {
    redirect('/admin?denied=1');
  }

  const { data: keys, error } = await supabase
    .from('api_keys')
    .select('id, name, prefix, permissions, created_at, last_used_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching API keys:', error);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="pt-2">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">Security & API</h1>
        <p className="text-[13px] text-[var(--color-muted)] mt-1">Manage API keys, access control, and platform security</p>
      </div>

      <div className="w-full">
        <SecurityClient initialKeys={keys || []} />
      </div>
    </div>
  );
}
