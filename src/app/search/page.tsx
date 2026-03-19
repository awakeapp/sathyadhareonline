import { createClient } from '@/lib/supabase/server';
import ArticleCard from '@/components/ui/ArticleCard';
import SectionHeader from '@/components/ui/SectionHeader';
import SearchBar from '@/components/ui/SearchBar';
import { Card } from '@/components/ui/Card';
import { Search, Library } from 'lucide-react';
import SearchFilters from '@/components/SearchFilters';

interface Props {
  searchParams: Promise<{ q?: string; c?: string; d?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, c: categorySlug, d: dateRange } = await searchParams;
  const supabase = await createClient();

  // Fetch all categories for the filter bar
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name');

  const categories = categoriesData || [];
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let results: any[] = [];
  let searched = false;

  if (q && q.trim()) {
    searched = true;
    let query = supabase
      .from('articles')
      .select('id, title, slug, excerpt, cover_image, published_at, category:categories!inner(name, id, slug)')
      .textSearch('search_vector', q.trim(), { type: 'websearch' })
      .eq('status', 'published')
      .eq('is_deleted', false)
      .lte('published_at', new Date().toISOString());

    // Apply category filter
    if (categorySlug) {
      query = query.eq('categories.slug', categorySlug);
    }

    // Apply date range filter
    if (dateRange) {
      const now = new Date();
      let startDate: Date | null = null;
      if (dateRange === 'week') startDate = new Date(now.setDate(now.getDate() - 7));
      else if (dateRange === 'month') startDate = new Date(now.setMonth(now.getMonth() - 1));
      else if (dateRange === 'year') startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      
      if (startDate) {
        query = query.gte('published_at', startDate.toISOString());
      }
    }

    const { data, error } = await query.order('published_at', { ascending: false });
    if (error) console.error('Search error:', error);
    results = data ?? [];
  }

  return (
    <div className="min-h-[100svh] px-4 py-4 pb-12 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl border-t border-[var(--color-border)]">
      
      {/* Header */}
      <section className="space-y-6 pt-2 mb-10 text-center">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--color-text)] tracking-tight">
            Search
          </h1>
          <p className="text-[var(--color-muted)] text-sm font-medium mt-2">
            Explore thousands of articles from Sathyadhare
          </p>
        </div>
        <div className="max-w-xl mx-auto">
          <SearchBar defaultValue={q} autoFocus={!q} />
        </div>
      </section>

      {/* Filters (Always show if categories exist) */}
      {categories.length > 0 && (
        <SearchFilters categories={categories} />
      )}

      {/* Results */}
      {searched ? (
        <section className="animate-fade-up">
          <SectionHeader
            title={
              results.length > 0
                ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`
                : `No results for "${q}"`
            }
          />

          {results.length === 0 ? (
            <Card className="text-center py-24 rounded-3xl mt-6 shadow-none border-dashed bg-[var(--color-surface)] border-[var(--color-border)]">
              <div className="flex justify-center mb-4 opacity-50">
                <Search className="w-12 h-12 text-[var(--color-muted)]" />
              </div>
              <p className="text-base font-bold text-[var(--color-text)] tracking-tight">
                We couldn&apos;t find any articles matching your search.
              </p>
              <p className="text-sm mt-2 font-medium text-[var(--color-muted)]">
                Try different keywords or browse our categories.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-4 mt-4">
              {results.map((article) => (
                <ArticleCard key={article.id} variant="list" article={article} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="text-center py-20 opacity-50">
          <div className="flex justify-center mb-4">
            <Library className="w-12 h-12 text-[var(--color-muted)]" />
          </div>
          <p className="text-sm text-[var(--color-muted)] font-medium">Enter a search term above to browse our archive.</p>
        </section>
      )}
    </div>
  );
}
