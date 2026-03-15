import { createClient } from '@/lib/supabase/server';
import ArticlesClientPage from './ArticlesClientPage';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; sort?: string }>;
}) {
  const { cat, sort } = await searchParams;
  const supabase = await createClient();

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('name, slug')
    .is('deleted_at', null)
    .order('name');

  // Fetch articles, filter by category if selected
  let query = supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image, published_at, category:categories(name), reactions:article_reactions(count)')
    .eq('article_reactions.type', 'like')
    .eq('status', 'published');

  if (cat) {
    const { data: catRow } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', cat)
      .single();
    if (catRow) query = query.eq('category_id', catRow.id);
  }

  // Sort
  const ascending = sort === 'oldest';
  query = query.order('published_at', { ascending });

  const { data: articles } = await query.limit(60);

  return (
    <ArticlesClientPage
      categories={categories || []}
      initialArticles={(articles || []) as unknown as any[]}
      activeCategory={cat || null}
      sortOrder={sort || 'newest'}
    />
  );
}
