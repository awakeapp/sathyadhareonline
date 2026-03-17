import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SequelsClient from './SequelsClient';

export const dynamic = 'force-dynamic';

export default async function SequelsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?denied=1');
  }

   const { data: sequels, error } = await supabase
    .from('sequels')
    .select('id, title, description, banner_image, status, category_id')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sequels:', error);
  }

  // Fetch sequel categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('type', 'sequel')
    .order('sort_order', { ascending: true });

  const { data: countsData } = await supabase
    .from('sequel_articles')
    .select('sequel_id');

  const countsRecord: Record<string, number> = {};
  for (const row of countsData || []) {
    countsRecord[row.sequel_id] = (countsRecord[row.sequel_id] || 0) + 1;
  }

  const sequelsWithCounts = (sequels || []).map(s => ({
    ...s,
    article_count: countsRecord[s.id] || 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="pt-2">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">Sequels</h1>
        <p className="text-[13px] text-[var(--color-muted)] mt-1">Manage series-based content and recurring issues</p>
      </div>

      <div className="w-full">
        <SequelsClient 
          initialSequels={sequelsWithCounts} 
          categories={categories || []}
        />
      </div>
    </div>
  );
}
