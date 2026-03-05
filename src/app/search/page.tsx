import { createClient } from '@/lib/supabase/server';
import ArticleCard from '@/components/ui/ArticleCard';
import SectionHeader from '@/components/ui/SectionHeader';
import SearchBar from '@/components/ui/SearchBar';
import { Card } from '@/components/ui/Card';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let results: any[] = [];
  let searched = false;

  if (q && q.trim()) {
    searched = true;
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, cover_image, published_at, category:categories(name)')
      .textSearch('search_vector', q.trim(), { type: 'websearch' })
      .eq('status', 'published').eq('is_deleted', false)
      .order('published_at', { ascending: false });
    if (error) console.error('Search error:', error);
    results = data ?? [];
  }

  return (
    <div className="font-sans antialiased min-h-[100svh] px-4 py-8 pb-32 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl border-t border-[var(--color-border)]">
      
      {/* Header */}
      <section className="space-y-6 pt-4 mb-10 text-center">
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
              <span className="text-5xl mb-4 block opacity-50">🔍</span>
              <p className="text-base font-bold text-[var(--color-text)] tracking-tight">
                We couldn&apos;t find any articles matching your search.
              </p>
              <p className="text-sm mt-2 font-medium text-[var(--color-muted)]">
                Try different keywords or browse our categories.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-5 mt-4">
              {results.map((article) => (
                <ArticleCard key={article.id} variant="list" article={article} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="text-center py-20 opacity-50">
          <span className="text-5xl mb-4 block">📚</span>
          <p className="text-sm text-[var(--color-muted)] font-medium">Enter a search term above to browse our archive.</p>
        </section>
      )}
    </div>
  );
}
