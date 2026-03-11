import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';
import SequelsClient from './SequelsClient';

export const dynamic = 'force-dynamic';

export default async function SequelsPage() {
  const supabase = await createClient();

  // ── Auth guard ───────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?error=unauthorized');
  }

  // ── Data Fetching ────────────────────────────────────────────────────────
  const { data: sequels, error } = await supabase
    .from('sequels')
    .select('id, title, description, banner_image, status')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sequels:', error);
  }

  const list = sequels || [];

  // Fetch article counts for all sequels
  const { data: countsData } = await supabase
    .from('sequel_articles')
    .select('sequel_id');

  const countsRecord: Record<string, number> = {};
  for (const row of countsData || []) {
    countsRecord[row.sequel_id] = (countsRecord[row.sequel_id] || 0) + 1;
  }

  const sequelsWithCounts = list.map(s => ({
    ...s,
    article_count: countsRecord[s.id] || 0,
  }));

  return (
    <div className="font-sans antialiased max-w-6xl mx-auto py-2 px-4 pb-24">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8 mt-4">
        <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)] shrink-0">
          <Link href="/admin">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight leading-tight">Sequels Engine</h1>
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
            {sequelsWithCounts.length} active collections
          </p>
        </div>
      </div>

      <SequelsClient initialSequels={sequelsWithCounts} />
    </div>
  );
}
