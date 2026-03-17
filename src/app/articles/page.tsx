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

  // Parallelize category list and article list fetching
  // Filter for 'article' type categories only
  const categoriesPromise = supabase
    .from('categories')
    .select('name, slug')
    .eq('type', 'article')
    .order('name');

  // Prepare article query
  let articlesQuery = supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image, published_at, category:categories!inner(name, slug), reactions:article_reactions(count)')
    .eq('article_reactions.type', 'like')
    .eq('status', 'published')
    .eq('is_standalone', true);


  if (cat) {
    articlesQuery = articlesQuery.eq('category.slug', cat);
  }

  const ascending = sort === 'oldest';
  articlesQuery = articlesQuery.order('published_at', { ascending }).limit(60);

  // Execute both in parallel
  const [catResponse, artResponse] = await Promise.all([
    categoriesPromise,
    articlesQuery
  ]);

  const categories = catResponse.data || [];
  const articles = artResponse.data || [];

  return (
    <ArticlesClientPage
      categories={categories || []}
      initialArticles={(articles || []) as unknown as React.ComponentProps<typeof ArticlesClientPage>['initialArticles']}
      activeCategory={cat || null}
      sortOrder={sort || 'newest'}
    />
  );
}
