import { createClient } from '@/lib/supabase/server';
import Container from '@/components/ui/Container';
import ArticleCard from '@/components/ui/ArticleCard';
import SectionHeader from '@/components/ui/SectionHeader';
import SearchBar from '@/components/ui/SearchBar';

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
    <div style={{ background: '#0a0b1a', minHeight: '100vh' }}>
      <Container className="py-8 min-h-[70vh] space-y-10">

        {/* Header */}
        <section className="text-center space-y-6 pt-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter" style={{ color: '#ffffff' }}>
              Search
            </h1>
            <p className="text-sm mt-2" style={{ color: '#8a91b8' }}>
              Explore thousands of articles from Sathyadhare
            </p>
          </div>
          <SearchBar defaultValue={q} autoFocus={!q} />
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
              <div
                className="text-center py-20 rounded-xl"
                style={{ background: '#111228', border: '1px solid #252645' }}
              >
                <span className="text-5xl mb-4 block">🔍</span>
                <p className="text-base font-medium" style={{ color: '#8a91b8' }}>
                  We couldn&apos;t find any articles matching your search.
                </p>
                <p className="text-sm mt-2" style={{ color: 'rgba(138,145,184,0.6)' }}>
                  Try different keywords or browse our categories.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="text-center py-16" style={{ opacity: 0.5 }}>
            <span className="text-5xl mb-4 block">📚</span>
            <p className="text-sm" style={{ color: '#8a91b8' }}>Enter a search term above to browse our archive.</p>
          </section>
        )}
      </Container>
    </div>
  );
}
