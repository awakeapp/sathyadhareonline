import { createClient } from '@/lib/supabase/server';
import NewsletterForm from '@/components/NewsletterForm';
import HeroBanner from '@/components/ui/HeroBanner';
import ArticleCard from '@/components/ui/ArticleCard';
import SectionHeader from '@/components/ui/SectionHeader';
import HorizontalScroller from '@/components/ui/HorizontalScroller';

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
    };
  }

  // 2) Latest Articles
  let { data: latestArticles } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image, published_at, category:categories(name)')
    .eq('status', 'published').eq('is_deleted', false)
    .order('published_at', { ascending: false }).limit(6);

  if (!latestArticles || latestArticles.length === 0) {
    latestArticles = [
      { id: 'l1', title: 'ಬಾಹ್ಯಾಕಾಶದ ಮರ್ಮಗಳು', slug: 'l1', excerpt: '', cover_image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80', published_at: new Date().toISOString(), category: { name: 'SCIENCE' } },
      { id: 'l2', title: 'ಆರೋಗ್ಯಕರ ಜೀವನಕ್ಕೆ ೧೦ ಸೂತ್ರಗಳು', slug: 'l2', excerpt: '', cover_image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80', published_at: new Date().toISOString(), category: { name: 'LIFE' } },
      { id: 'l3', title: 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆಯ ಕ್ರಾಂತಿ', slug: 'l3', excerpt: '', cover_image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80', published_at: new Date().toISOString(), category: { name: 'TECH' } },
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
      { id: 't1', title: 'ಕರ್ನಾಟಕದ ಸಂಸ್ಕೃತಿ ಮತ್ತು ಇತಿಹಾಸ', slug: 't1', cover_image: 'https://images.unsplash.com/photo-1600100397561-433ff484439c?w=800&q=80', category: { name: 'CULTURE' }, published_at: new Date().toISOString() },
      { id: 't2', title: 'ಪರಿಸರ ಸಂರಕ್ಷಣೆ ನಮ್ಮ ಹೊಣೆ', slug: 't2', cover_image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb773b09?w=800&q=80', category: { name: 'NATURE' }, published_at: new Date().toISOString() },
    ] as any;
  }

  // 4) Series (Sequels)
  let { data: latestSequels } = await supabase
    .from('sequels').select('id, title, slug, banner_image, published_at')
    .eq('status', 'published').eq('is_deleted', false)
    .order('published_at', { ascending: false }).limit(6);

  if (!latestSequels || latestSequels.length === 0) {
    latestSequels = [
      { id: 's1', title: 'ಭಾರತೀಯ ಕಲೆಗಳು', slug: 's1', banner_image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=80', published_at: new Date().toISOString() },
      { id: 's2', title: 'ಆಧುನಿಕ ವೈದ್ಯಕೀಯ', slug: 's2', banner_image: 'https://images.unsplash.com/photo-1532187875605-2fe358a77e76?w=800&q=80', published_at: new Date().toISOString() },
    ] as any;
  }

  return (
    <div className="min-h-[100svh] px-4 pt-1 pb-32 max-w-lg mx-auto sm:max-w-2xl lg:max-w-5xl">
      
      {/* Hero */}
      {featured && (
        <div className="mb-6 pt-0">
          <HeroBanner article={featured} />
        </div>
      )}

      {/* Latest Sequels */}
      {latestSequels && latestSequels.length > 0 && (
        <section className="mb-10">
          <SectionHeader title="Latest Sequels" />
          <HorizontalScroller className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-5">
            {latestSequels.map((seq: any) => (
              <div key={seq.id} style={{ minWidth: '180px', width: '45vw', maxWidth: '220px' }}>
                <ArticleCard
                  variant="grid-dark"
                  article={{
                    ...seq,
                    cover_image: seq.banner_image,
                    category: { name: 'SEQUEL' }
                  }}
                />
              </div>
            ))}
          </HorizontalScroller>
        </section>
      )}

      {/* Trending Articles */}
      {trending.length > 0 && (
        <section className="mb-10">
          <SectionHeader title="Trending Articles" />
          <HorizontalScroller className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-5">
            {trending.map((item: any) => (
              <div key={item.id} style={{ minWidth: '180px', width: '45vw', maxWidth: '220px' }}>
                <ArticleCard variant="grid-dark" article={item} />
              </div>
            ))}
          </HorizontalScroller>
        </section>
      )}

      {/* Latest Articles */}
      {latestArticles && latestArticles.length > 0 && (
        <section className="mb-10">
          <SectionHeader title="Latest Articles" />
          <HorizontalScroller className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-5">
            {latestArticles.map((item: any) => (
              <div key={item.id} style={{ minWidth: '180px', width: '45vw', maxWidth: '220px' }}>
                <ArticleCard variant="grid-dark" article={item} />
              </div>
            ))}
          </HorizontalScroller>
        </section>
      )}

      {/* Community Banner */}
      <section 
        className="rounded-[2rem] p-10 flex flex-col sm:flex-row items-center gap-6 shadow-2xl mt-12 mb-4"
        style={{ background: '#201d31', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="sm:w-1/2 flex flex-col justify-center gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tighter">
            JOIN READERS<br />COMMUNITY
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-[#a3a0b5] font-bold">Get weekly updates in your inbox</p>
        </div>
        <div className="w-full sm:w-1/2 flex items-center justify-end">
          <NewsletterForm />
        </div>
      </section>

    </div>
  );
}
