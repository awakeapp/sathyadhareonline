import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import SavedClientPage from './SavedClientPage';

export const metadata: Metadata = {
  title: 'Saved Articles | Sathyadhare',
  description: 'Your saved articles on Sathyadhare Digital Journal.',
};

export const dynamic = 'force-dynamic';

export default async function SavedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select(`
      id,
      created_at,
      article:articles (
        id, title, slug, excerpt, cover_image,
        status, is_deleted, published_at,
        category:categories(name)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  type ArticleRow = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_image: string | null;
    status: string;
    is_deleted: boolean;
    published_at: string;
    category?: { name: string } | { name: string }[] | null;
  };

  const saved = (bookmarks ?? [])
    .map(b => ({ ...b.article as unknown as ArticleRow, savedAt: b.created_at }))
    .filter(a => a && a.status === 'published' && !a.is_deleted);

  return <SavedClientPage articles={saved as any} />;
}
