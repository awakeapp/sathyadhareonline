import { createClient } from '@/lib/supabase/server';
import NewsletterForm from '@/components/NewsletterForm';
import HeroBanner from '@/components/ui/HeroBanner';
import ArticleCard from '@/components/ui/ArticleCard';
import SectionHeader from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  // 1) Hero
  const { data: featuredData } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image, category:categories(name)')
    .eq('is_featured', true).eq('status', 'published').eq('is_deleted', false)
    .single();

  let featured = featuredData;
  if (!featured) {
    const { data: fb } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, cover_image, category:categories(name)')
      .eq('status', 'published').eq('is_deleted', false)
      .order('published_at', { ascending: false }).limit(1).single();
    featured = fb ?? {
      id: 'mock-hero',
      title: 'ವಿದ್ಯುತ್ ವಾಹನಗಳ ಭವಿಷ್ಯ ಮತ್ತು ಸವಾಲುಗಳು',
      slug: 'mock-hero',
      excerpt: 'ಭಾರತದಲ್ಲಿ ಎಲೆಕ್ಟ್ರಿಕ್ ವಾಹನಗಳ ಬಳಕೆ ಹೆಚ್ಚುತ್ತಿದೆ. ಆದರೆ ಮೂಲಸೌಕರ್ಯಗಳ ಕೊರತೆ ಒಂದು ದೊಡ್ಡ ಸವಾಲಾಗಿ ಪರಿಣಮಿಸಿದೆ.',
      cover_image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&q=80',
      category: { name: 'TECHNOLOGY' }
    } as any;
  }

  // 2) Latest Articles
  let { data: latestArticles } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image, published_at, category:categories(name)')
    .eq('status', 'published').eq('is_deleted', false)
    .order('published_at', { ascending: false }).limit(6);

  if (!latestArticles || latestArticles.length === 0) {
    latestArticles = [
      { id: 'l1', title: 'ಭಾರತೀಯ ಬಾಹ್ಯಾಕಾಶ ಸಂಶೋಧನಾ ಸಂಸ್ಥೆಯ (ISRO) ಐತಿಹಾಸಿಕ ನೆಗೆತ', slug: 'l1', excerpt: '', cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', published_at: new Date().toISOString(), category: { name: 'SCIENCE' } },
      { id: 'l2', title: 'ದೈನಂದಿನ ಜೀವನದಲ್ಲಿ ಯೋಗ: ಮಾನಸಿಕ ಮತ್ತು ದೈಹಿಕ ಶಾಂತಿಗಾಗಿ', slug: 'l2', excerpt: '', cover_image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', published_at: new Date().toISOString(), category: { name: 'LIFE' } },
      { id: 'l3', title: 'ಆರ್ಟಿಫಿಶಿಯಲ್ ಇಂಟೆಲಿಜೆನ್ಸ್ ಭವಿಷ್ಯವನ್ನು ಹೇಗೆ ಬದಲಾಯಿಸುತ್ತಿದೆ?', slug: 'l3', excerpt: '', cover_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80', published_at: new Date().toISOString(), category: { name: 'TECH' } },
      { id: 'l4', title: 'ಕರ್ನಾಟಕದ ಪ್ರಾಚೀನ ದೇವಾಲಯಗಳ ವಾಸ್ತುಶಿಲ್ಪದ ಪರಂಪರೆ', slug: 'l4', excerpt: '', cover_image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=80', published_at: new Date().toISOString(), category: { name: 'HISTORY' } },
    ] as any;
  }

  // 3) Trending
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: viewRows } = await supabase
    .from('article_views')
    .select('article_id')
    .gte('viewed_at', sevenDaysAgo.toISOString());

  const viewCounts: Record<string, number> = {};
  for (const row of viewRows ?? []) {
    viewCounts[row.article_id] = (viewCounts[row.article_id] ?? 0) + 1;
  }
  const topIds = Object.entries(viewCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id);

  let trending: any[] = [];
  if (topIds.length > 0) {
    const { data: td } = await supabase
      .from('articles')
      .select('id, title, slug, cover_image, category:categories(name), published_at')
      .in('id', topIds)
      .eq('status', 'published')
      .eq('is_deleted', false);
    
    if (td) {
      trending = td.sort((a, b) => (viewCounts[b.id] ?? 0) - (viewCounts[a.id] ?? 0));
    }
  }

  if (trending.length === 0) {
    trending = [
      { id: 't1', title: 'ಮಳೆಗಾಲದಲ್ಲಿ ಸಹಜ ಪ್ರಕೃತಿಯ ಸೌಂದರ್ಯದ ದರ್ಶನ', slug: 't1', cover_image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80', category: { name: 'NATURE' }, published_at: new Date().toISOString() },
      { id: 't2', title: 'ಮಕ್ಕಳಲ್ಲಿ ಕಥೆ ಓದುವ ಹವ್ಯಾಸವನ್ನು ಹೇಗೆ ಬೆಳೆಸುವುದು?', slug: 't2', cover_image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80', category: { name: 'LITERATURE' }, published_at: new Date().toISOString() },
      { id: 't3', title: 'ಡಿಜಿಟಲ್ ಜಗತ್ತಿನಲ್ಲಿ ಡೇಟಾ ಸುರಕ್ಷತೆಯ ಸವಾಲುಗಳು', slug: 't3', cover_image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', category: { name: 'TECH' }, published_at: new Date().toISOString() },
    ] as any;
  }

  return (
    <div className="font-sans antialiased min-h-[100svh] px-4 pt-1 pb-32 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl scroll-smooth">
      
      {/* Hero */}
      {featured && (
        <div className="mb-8 pt-0 mt-4 sm:mt-6">
          <HeroBanner article={featured} />
        </div>
      )}

      {/* Trending Articles - List View */}
      {trending.length > 0 && (
        <section className="mb-12">
          <SectionHeader title="Trending Articles" />
          <div className="flex flex-col gap-5 mt-5">
            {trending.map((item: any) => (
              <div key={item.id} className="w-full">
                <ArticleCard variant="list" article={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latest Articles - List View */}
      {latestArticles && latestArticles.length > 0 && (
        <section className="mb-12">
          <SectionHeader title="Latest Articles" />
          <div className="flex flex-col gap-5 mt-5">
            {latestArticles.map((item: any) => (
              <div key={item.id} className="w-full">
                <ArticleCard variant="list" article={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Community Banner */}
      <Card className="rounded-[2rem] p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8 shadow-none mt-16 mb-4 bg-[var(--color-surface-2)] border-transparent overflow-hidden relative">
        {/* Subtle decorative background blur */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--color-primary)]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="sm:w-[45%] flex flex-col justify-center gap-3 relative z-10 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
             JOIN READERS<br />COMMUNITY
          </h2>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.15em] text-[var(--color-primary)] font-bold">Get weekly updates in your inbox</p>
        </div>
        <div className="w-full sm:w-[55%] flex items-center justify-end relative z-10">
          <NewsletterForm />
        </div>
      </Card>

    </div>
  );
}
