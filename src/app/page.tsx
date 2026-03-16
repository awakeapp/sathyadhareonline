import { createClient } from '@/lib/supabase/server';
import HeroBanner from '@/components/ui/HeroBanner';
import BannerCarousel from '@/components/ui/BannerCarousel';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Layers, BookOpen } from 'lucide-react';
import ArticleCard from '@/components/ui/ArticleCard';
import SectionHeader from '@/components/ui/SectionHeader';
import HomeLatestArticles from '@/components/HomeLatestArticles';


export const revalidate = 60;

interface ArticleWithCategory {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image?: string | null;
  published_at?: string | null;
  category: { name: string } | { name: string }[] | null;
  reactions?: { count: number }[];
  author?: { full_name: string } | null;
}

export default async function HomePage() {
  const supabase = await createClient();

  // 1) Hero
  const { data: featuredData } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image, category:categories(name), reactions:article_reactions(count), author:profiles(full_name)')
    .eq('article_reactions.type', 'like')
    .eq('is_featured', true).eq('status', 'published').eq('is_deleted', false)
    .eq('is_standalone', true) // Only standalone for home hero
    .single();

  let featured = featuredData as unknown as ArticleWithCategory | null;
  if (!featured) {
    const { data: fb } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, cover_image, category:categories(name), reactions:article_reactions(count), author:profiles(full_name)')
      .eq('article_reactions.type', 'like')
      .eq('status', 'published').eq('is_deleted', false)
      .eq('is_standalone', true)
      .order('published_at', { ascending: false }).limit(1).single();
    featured = fb as unknown as ArticleWithCategory | null;
  }

  // 2) Latest Articles (Standalone only)
  let { data: latestArticles } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image, published_at, category:categories(name), reactions:article_reactions(count), author:profiles(full_name)')
    .eq('article_reactions.type', 'like')
    .eq('status', 'published').eq('is_deleted', false)
    .eq('is_standalone', true)
    .order('published_at', { ascending: false }).limit(6);

  if (!latestArticles) {
    latestArticles = [];
  }

  // 2.5) Latest Sequels (Digital Issues)
  const { data: latestSequels } = await supabase
    .from('sequels')
    .select('id, title, slug, banner_image, published_at')
    .eq('status', 'published')
    .eq('is_deleted', false)
    .order('published_at', { ascending: false })
    .limit(4);

  // 2.6) Latest Books (Library)
  const { data: latestBooks } = await supabase
    .from('books')
    .select('id, title, slug, cover_image, author_name')
    .eq('status', 'published')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(4);

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
      .select('id, title, slug, cover_image, category:categories(name), published_at, reactions:article_reactions(count), author:profiles(full_name)')
      .eq('article_reactions.type', 'like')
      .in('id', topIds)
      .eq('status', 'published')
      .eq('is_deleted', false)
      .eq('is_standalone', true); // Only standalone trending on home
    
    if (td) {
      trending = (td as unknown as ArticleWithCategory[]).sort((a, b) => (viewCounts[b.id] ?? 0) - (viewCounts[a.id] ?? 0));
    }
  }

  // 4) Active banners for carousel
  const { data: bannersData } = await supabase
    .from('banners')
    .select('id, image_url, link_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const activeBanners = bannersData || [];

  return (
    <div className="font-sans antialiased min-h-[100svh] px-4 pt-2 pb-0 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl scroll-smooth">

      {/* ── 1. Banner Carousel ── */}
      <div className="mb-8">
        {activeBanners.length > 0 ? (
          <BannerCarousel banners={activeBanners} />
        ) : featured ? (
          <HeroBanner article={featured} />
        ) : null}
      </div>

      {/* Latest Digital Issues (Sequels) - New Section */}
      {latestSequels && latestSequels.length > 0 && (
        <section className="mb-12">
          <SectionHeader title="Digital Issues" href="/sequels" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            {latestSequels.map((seq) => (
              <Link key={seq.id} href={`/sequels/${seq.slug}`} className="group block">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-sm group-hover:shadow-md transition-all">
                  {seq.banner_image ? (
                    <Image 
                      src={seq.banner_image} 
                      alt={seq.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">
                       <Layers size={24} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-[#685de6] mb-1">Weekly Issue</p>
                     <p className="text-white font-bold text-xs line-clamp-2 leading-tight uppercase tracking-tight italic">{seq.title}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Articles */}
      {trending.length > 0 && (
        <section className="mb-12">
          <SectionHeader title="Trending Articles" />
          <div className="flex flex-col gap-4 mt-5">
            {trending.map((article) => (
              <ArticleCard key={article.id} variant="list" article={article as unknown as ArticleWithCategory} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Books (Library) - New Section */}
      {latestBooks && latestBooks.length > 0 && (
        <section className="mb-12">
          <SectionHeader title="Digital Library" href="/library" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-5">
            {latestBooks.map((book) => (
              <Link key={book.id} href={`/library/${book.slug}`} className="group block">
                 <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[var(--color-surface-2)] shadow-[0_10px_30px_rgba(0,0,0,0.1)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all">
                    {book.cover_image ? (
                      <Image src={book.cover_image} alt={book.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">
                        <BookOpen size={30} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    {/* Spine lighting */}
                    <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-white/20 to-transparent" />
                 </div>
                 <h4 className="mt-3 text-xs font-black text-[var(--color-text)] uppercase tracking-tight line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">{book.title}</h4>
                 <p className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-widest mt-1">{book.author_name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Articles */}
      {latestArticles && latestArticles.length > 0 && (
        <section className="mb-12">
          <SectionHeader title="Latest Articles" href="/articles" />
          <div className="mt-5">
            <HomeLatestArticles initialArticles={latestArticles as unknown as ArticleWithCategory[]} />
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
