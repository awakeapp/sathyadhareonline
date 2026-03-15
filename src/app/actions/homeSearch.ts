'use server';

import { createClient } from '@/lib/supabase/server';

export type HomeSearchResult = {
  id: string;
  title: string;
  type: 'article' | 'sequel' | 'book';
  href: string;
};

export async function fetchHomeSuggestions(queries: string[]): Promise<HomeSearchResult[]> {
  if (!queries || queries.length === 0) return [];
  const validQueries = queries.filter(q => q && q.trim().length > 0).map(q => q.trim());
  if (validQueries.length === 0) return [];

  const supabase = await createClient();
  const orCondition = validQueries.map(q => `title.ilike.%${q}%`).join(',');

  // Parallel fetch articles, sequels, books
  const [
    { data: articles },
    { data: sequels },
    { data: books }
  ] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, slug')
      .or(orCondition)
      .eq('status', 'published')
      .eq('is_deleted', false)
      .limit(3),
    supabase
      .from('sequels')
      .select('id, title, slug')
      .or(orCondition)
      .eq('status', 'published')
      .eq('is_deleted', false)
      .limit(3),
    supabase
      .from('books')
      .select('id, title, drive_link')
      .or(orCondition)
      .eq('is_active', true)
      .limit(3)
  ]);

  const results: HomeSearchResult[] = [];

  articles?.forEach(a => results.push({ id: a.id, title: a.title, type: 'article', href: `/articles/${a.slug}` }));
  sequels?.forEach(s => results.push({ id: s.id, title: s.title, type: 'sequel', href: `/sequels/${s.slug}` }));
  books?.forEach(b => results.push({ id: b.id, title: b.title, type: 'book', href: `/library/${b.id}` }));

  return results;
}
