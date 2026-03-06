import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ApiKeysClient from './ApiKeysClient';

export const dynamic = 'force-dynamic';

export default async function ApiKeysPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'super_admin') {
    redirect('/admin?error=unauthorized');
  }

  // Fetch only the API keys since schema `auth` is restricted
  const { data: keys, error } = await supabase
    .from('api_keys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed fetching api keys:', error);
  }

  return <ApiKeysClient keys={keys || []} />;
}
