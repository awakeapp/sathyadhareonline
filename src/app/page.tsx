import { createClient } from '@/lib/supabase/server';
import HeroBanner from '@/components/ui/HeroBanner';
import BannerCarousel from '@/components/ui/BannerCarousel';
import HomeSearchBar from '@/components/ui/HomeSearchBar';
import HomeBooksWidget from '@/components/ui/HomeBooksWidget';
import ArticleCard from '@/components/ui/ArticleCard';
import SectionHeader from '@/components/ui/SectionHeader';
import { ChevronRight } from 'lucide-react';

export const revalidate = 60;

interface ArticleWithCategory {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image?: string | null;
  published_at?: string | null;
  category: { name: string } | null;
}

export default async function HomePage() {
  const supabase = await createClient();

  // 1) Hero
  const { data: featuredData } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image, category:categories(name)')
    .eq('is_featured', true).eq('status', 'published').eq('is_deleted', false)
    .single();

  let featured = featuredData as ArticleWithCategory | null;
  if (!featured) {
    const { data: fb } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, cover_image, category:categories(name)')
      .eq('status', 'published').eq('is_deleted', false)
      .order('published_at', { ascending: false }).limit(1).single();
    featured = fb as ArticleWithCategory | null;
  }

  // 2) Latest Articles
  let { data: latestArticles } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image, published_at, category:categories(name)')
    .eq('status', 'published').eq('is_deleted', false)
    .order('published_at', { ascending: false }).limit(6);

  if (!latestArticles) {
    latestArticles = [];
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

  let trending: ArticleWithCategory[] = [];
  if (topIds.length > 0) {
    const { data: td } = await supabase
      .from('articles')
      .select('id, title, slug, cover_image, category:categories(name), published_at')
      .in('id', topIds)
      .eq('status', 'published')
      .eq('is_deleted', false);
    
    if (td) {
      trending = (td as ArticleWithCategory[]).sort((a, b) => (viewCounts[b.id] ?? 0) - (viewCounts[a.id] ?? 0));
    }
  }

  // 4) Active banners for carousel
  const { data: bannersData } = await supabase
    .from('banners')
    .select('id, image_url, link_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const activeBanners = bannersData || [];

  // 5) Active books for PDF library
  const { data: booksData } = await supabase
    .from('books')
    .select('id, title, author_name, cover_image, drive_link, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const activeBooks = booksData || [];

  return (
    <div className="font-sans antialiased min-h-[100svh] px-4 pt-2 pb-0 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl scroll-smooth">

      {/* ── 0. Inline search bar (Translates Eng -> Kannada) ── */}
      <HomeSearchBar />

      {/* ── 0.5. PDF Library (horizontally scrollable books) ── */}
      {activeBooks.length > 0 && (
        <HomeBooksWidget books={activeBooks} />
      )}

      {/* ── 1. Banner Carousel (landscape 16:9) — or fallback hero ── */}
      <div className="mb-8">
        {activeBanners.length > 0 ? (
          <BannerCarousel banners={activeBanners} />
        ) : featured ? (
          <HeroBanner article={featured} />
        ) : null}
      </div>

      {/* Trending Articles - List View */}
      {trending.length > 0 && (
        <section className="mb-12">
          <SectionHeader title="Trending Articles" />
          <div className="flex flex-col gap-5 mt-5">
            {trending.map((article) => (
              <ArticleCard key={article.id} variant="list" article={article as unknown as ArticleWithCategory} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Articles - List View */}
      {latestArticles && latestArticles.length > 0 && (
        <section className="mb-12">
          <SectionHeader title="Latest Articles" href="/articles" />
          <div className="flex flex-col gap-5 mt-5">
            {latestArticles.map((item) => (
              <ArticleCard key={item.id} variant="list" article={item as unknown as ArticleWithCategory} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!featured && latestArticles.length === 0 && trending.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[var(--color-text-secondary)]">No articles found.</p>
        </div>
      )}

      {/* Community Banner — WhatsApp Channel CTA */}
      <a 
        href="https://whatsapp.com/channel/0029Va9R6H8AojZ0xT3uMh1C" 
        target="_blank" 
        rel="noopener noreferrer"
        className="block rounded-[2rem] p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8 shadow-[0_20px_50px_rgba(104,93,230,0.12)] mt-16 mb-12 bg-white dark:bg-[#111b21] border border-[var(--color-border)] overflow-hidden relative group active:scale-[0.98] transition-all"
      >
        {/* Decorative background accent */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[var(--color-primary)]/5 rounded-full blur-3xl group-hover:bg-[var(--color-primary)]/10 transition-colors" />
        
        <div className="sm:w-[60%] flex flex-col justify-center gap-3 relative z-10 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
             <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#25D366]">Community</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--color-text)] leading-tight tracking-tight">
             JOIN READERS<br />CHANNEL
          </h2>
          <p className="text-xs sm:text-sm font-medium text-[var(--color-muted)]">Get instant updates and exclusive content directly on your WhatsApp.</p>
        </div>
        
        <div className="w-full sm:w-[40%] flex items-center justify-center sm:justify-end relative z-10">
          <div className="px-8 py-4 rounded-2xl bg-[#25D366] text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-[#25D366]/20 group-hover:scale-105 group-hover:shadow-[#25D366]/30 active:scale-95 transition-all flex items-center gap-3">
             Follow Channel
             <ChevronRight className="w-5 h-5" strokeWidth={3} />
          </div>
        </div>
      </a>

    </div>
  );
}
