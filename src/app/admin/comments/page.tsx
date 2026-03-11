import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';
import CommentsClient from './CommentsClient';

export const dynamic = 'force-dynamic';

export default async function AdminCommentsPage() {
  const supabase = await createClient();

  // ── Auth guard: admin / super_admin only ─────────────────────────────────
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
  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      id,
      article_id,
      guest_name,
      user_id,
      content,
      status,
      is_spam,
      created_at,
      articles ( title ),
      profiles ( full_name, email )
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching comments:', error);

  // Derive unique articles for the filter from the comments
  const articleMap = new Map<string, string>();
  for (const c of comments || []) {
    if (c.article_id && !articleMap.has(c.article_id)) {
       articleMap.set(c.article_id, (c.articles as { title?: string } | null)?.title || c.article_id);
    }
  }
  const articlesList = Array.from(articleMap.entries()).map(([id, title]) => ({ id, title }));

  const pendingCount = comments?.filter(c => c.status === 'pending').length ?? 0;

  return (
    <div className="font-sans antialiased max-w-5xl mx-auto py-2 px-4 pb-24">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8 mt-4">
        <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)] shrink-0">
          <Link href="/admin">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight leading-tight">Comment Engine</h1>
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
            {pendingCount} Pending Triage · {comments?.length ?? 0} Global Log
          </p>
        </div>
      </div>

      <CommentsClient 
        comments={(comments as any) || []}
        articlesList={articlesList} />

    </div>
  );
}
