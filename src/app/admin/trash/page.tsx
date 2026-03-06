import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';
import TrashManagerClient from './TrashManagerClient';

export const dynamic = 'force-dynamic';

export interface TrashItem {
  id: string;
  title?: string;
  name?: string;
  content?: string;
  guest_name?: string;
  deleted_at: string;
  articles?: { title: string };
  status?: string;
  type: 'article' | 'category' | 'sequel' | 'comment';
}

export default async function TrashPage() {
  const supabase = await createClient();

  // ── Auth & Guard ─────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'super_admin') {
    redirect('/admin');
  }

  // ── Fetch Deleted Items ───────────────────────────────────────
  const { data: articles } = await supabase.from('articles').select('id, title, deleted_at, status').eq('is_deleted', true).order('deleted_at', { ascending: false });
  const { data: categories } = await supabase.from('categories').select('id, name, deleted_at').eq('is_deleted', true).order('deleted_at', { ascending: false });
  const { data: sequels } = await supabase.from('sequels').select('id, title, deleted_at').eq('is_deleted', true).order('deleted_at', { ascending: false });
  
  // Use explicit selection for comments and handle potential array return for joins
  const { data: rawComments } = await supabase
    .from('comments')
    .select('id, content, guest_name, deleted_at, articles(title)')
    .eq('is_deleted', true)
    .order('deleted_at', { ascending: false });

  // Map each data set to the common TrashItem shape
  const mappedArticles: TrashItem[] = (articles || []).map(a => ({ ...a, type: 'article' }));
  const mappedCategories: TrashItem[] = (categories || []).map(c => ({ ...c, type: 'category' }));
  const mappedSequels: TrashItem[] = (sequels || []).map(s => ({ ...s, type: 'sequel' }));
  const mappedComments: TrashItem[] = (rawComments || []).map(c => ({
    ...c,
    type: 'comment',
    articles: Array.isArray(c.articles) ? (c.articles[0] as { title: string }) : (c.articles as { title: string } | null || undefined)
  }));

  return (
    <div className="font-sans antialiased max-w-4xl mx-auto py-2 px-4 pb-20">
      <div className="flex items-center gap-4 mb-8 mt-4">
        <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)]">
          <Link href="/admin">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight leading-tight text-white">Trash Bin</h1>
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
            Recover or permanently purge content
          </p>
        </div>
      </div>

      <TrashManagerClient 
        initialArticles={mappedArticles}
        initialCategories={mappedCategories}
        initialSequels={mappedSequels}
        initialComments={mappedComments}
      />
    </div>
  );
}
