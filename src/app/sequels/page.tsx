import { createClient } from '@/lib/supabase/server';
import SectionHeader from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Library, Calendar, BookOpen, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const revalidate = 60;

export default async function SequelsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const supabase = await createClient();

  // 1. Fetch Sequel Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('type', 'sequel')
    .order('sort_order', { ascending: true });

  // 2. Determine active category id
  const activeCategory = categories?.find(c => c.slug === category);

  // 3. Fetch Sequels with their articles
  // Using a join to get articles attached to sequels via sequel_articles
  let query = supabase
    .from('sequels')
    .select(`
      *,
      sequel_articles (
        order_index,
        articles (
          id,
          title,
          slug,
          excerpt,
          cover_image,
          author:profiles(full_name),
          published_at
        )
      )
    `)
    .eq('status', 'published')
    .eq('is_deleted', false)
    .order('published_at', { ascending: false });

  if (activeCategory) {
    query = query.eq('category_id', activeCategory.id);
  }

  const { data: sequelsData, error } = await query;

  if (error) {
    console.error('Error fetching sequels:', error);
  }

  // Process data to flatten articles
  const sequels = (sequelsData || []).map(seq => ({
    ...seq,
    articles: (seq.sequel_articles || [])
      .map((sa: any) => sa.articles)
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const saA = seq.sequel_articles.find((x: any) => x.articles?.id === a.id);
        const saB = seq.sequel_articles.find((x: any) => x.articles?.id === b.id);
        return (saA?.order_index || 0) - (saB?.order_index || 0);
      })
  }));

  const hasSequels = sequels.length > 0;

  return (
    <div className="min-h-[100svh] px-4 pt-1 pb-32 max-w-lg mx-auto sm:max-w-2xl lg:max-w-5xl">
      
      <SectionHeader title="Weekly Sequels" />

      {/* ── Tabs Container ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-6 scrollbar-hide px-1 mt-4">
        <Link 
          href="/sequels"
          className={`shrink-0 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
            !category 
              ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20' 
              : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'
          }`}
        >
          All Series
        </Link>
        {categories?.map((cat) => (
          <Link 
            key={cat.id}
            href={`/sequels?category=${cat.slug}`}
            className={`shrink-0 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
              category === cat.slug 
                ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20' 
                : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {!hasSequels ? (
        <Card className="flex flex-col items-center justify-center py-24 px-6 text-center rounded-[2.5rem] bg-white dark:bg-[#111b21] border border-[var(--color-border)] shadow-[0_20px_50px_rgba(0,0,0,0.05)] mt-4 animate-fade-up">
          <div className="w-20 h-20 rounded-3xl bg-[var(--color-primary)]/5 flex items-center justify-center text-[var(--color-primary)] mb-6">
            <Library size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text)] tracking-tight mb-2">
            No Sequels Found
          </h2>
          <p className="max-w-xs text-sm font-medium text-[var(--color-muted)] leading-relaxed">
            There are no issues published in this category yet. Check back soon for fresh content!
          </p>
        </Card>
      ) : (
        <div className="space-y-12 mt-4">
          {sequels.map((seq) => (
            <div key={seq.id} className="animate-fade-up">
              {/* ── Main Sequel Card ── */}
              <Link href={`/sequels/${seq.slug}`}>
                <Card className="relative h-[240px] sm:h-[320px] rounded-[2.5rem] overflow-hidden border-none shadow-2xl group active:scale-[0.98] transition-all">
                  {seq.banner_image ? (
                    <Image 
                      src={seq.banner_image} 
                      alt={seq.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-500/10 flex items-center justify-center text-indigo-500/20">
                      <Library size={80} />
                    </div>
                  )}
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                     <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/20 text-[10px] font-black text-white uppercase tracking-[0.2em]">
                           {seq.published_at ? new Date(seq.published_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Featured'}
                        </span>
                     </div>
                     <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                        {seq.title}
                     </h2>
                     {seq.description && (
                       <p className="text-white/70 text-sm font-medium mt-2 line-clamp-2 italic max-w-md">
                          {seq.description}
                       </p>
                     )}
                  </div>
                </Card>
              </Link>

              {/* ── Article List for this Sequel ── */}
              <div className="mt-8 space-y-4 px-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-1 bg-[var(--color-primary)] rounded-full" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">Included Articles</span>
                </div>
                
                {seq.articles.length === 0 ? (
                  <p className="text-xs font-bold text-[var(--color-muted)] italic py-4">Coming Soon...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {seq.articles.map((art: any) => (
                      <Link key={art.id} href={`/articles/${art.slug}`} className="group active:scale-[0.98] transition-all">
                        <div className="flex gap-4 p-4 rounded-3xl bg-[var(--color-surface-2)] border border-transparent hover:border-[var(--color-primary)]/20 transition-all h-full">
                           <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 relative">
                              <Image 
                                src={art.cover_image || '/placeholder.png'} 
                                alt={art.title} 
                                fill 
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                           </div>
                           <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h4 className="text-sm font-black text-[var(--color-text)] tracking-tight leading-tight mb-2 line-clamp-2">
                                {art.title}
                              </h4>
                              <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest">
                                 <span className="flex items-center gap-1">
                                    <User size={12} className="text-[var(--color-primary)]" />
                                    {art.author?.full_name || 'Staff'}
                                 </span>
                              </div>
                           </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
