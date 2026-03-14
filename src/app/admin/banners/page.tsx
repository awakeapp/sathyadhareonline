import { createClient } from '@/lib/supabase/server';
import BannersClient from './BannersClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Banners | Admin' };
export const dynamic = 'force-dynamic';

export default async function BannersPage() {
  const supabase = await createClient();

  // Ensure table exists (best-effort, may already exist)
  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .order('created_at', { ascending: false });

  return <BannersClient initialBanners={banners || []} />;
}
