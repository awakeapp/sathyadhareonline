import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PlansClient from './PlansClient';

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'super_admin') redirect('/admin?error=unauthorized');

  const { data: plans } = await supabase.from('subscription_plans').select('*').order('created_at', { ascending: true });

  return <PlansClient initialPlans={plans || []} />;
}
