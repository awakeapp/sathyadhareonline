import { createClient } from '@/lib/supabase/server';
import BooksClient from './BooksClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Books | Admin' };
export const dynamic = 'force-dynamic';

export default async function BooksPage() {
  const supabase = await createClient();

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch articles to allow adding them as chapters
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, category:categories(name)')
    .eq('is_deleted', false)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  const mappedArticles = (articles || []).map(a => ({
    id: a.id,
    title: a.title,
    category: a.category as { name: string } | { name: string }[] | null,
  }));

  return <BooksClient initialBooks={books || []} availableArticles={mappedArticles} />;
}
