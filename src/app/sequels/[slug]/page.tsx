import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ScrollRestorer } from '@/components/ScrollRestorer';
import { Layers, Plus } from 'lucide-react';

export const revalidate = 60;

export default async function SequelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch the sequel
  const { data: sequel, error: sequelError } = await supabase
    .from('sequels')
    .select('id, title, description, banner_image, published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('is_deleted', false)
    .single();

  if (sequelError || !sequel) {
    return notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch attached articles
  const { data: sequelArticles, error: attachedError } = await supabase
    .from('sequel_articles')
    .select(`
      order_index,
      article:articles (
        id,
        title,
        slug,
        excerpt,
        status,
        is_deleted,
        published_at,
        created_at
      )
    `)
    .eq('sequel_id', sequel.id)
    .order('order_index', { ascending: true });

  if (attachedError) {
    console.error('Error fetching attached articles:', attachedError);
  }

  type ArticleRow = { id: string; title: string; slug: string; excerpt: string | null; status: string; is_deleted: boolean; published_at: string | null };
  const safeArticles = (sequelArticles || [])
    .map((sa) => sa.article as unknown as ArticleRow)
    .filter((a) => a && a.status === 'published' && a.is_deleted === false);

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-[calc(var(--bottom-nav-height)+1rem)]">
       <ScrollRestorer storageKey={`sequel_${sequel.id}`} isAuthenticated={!!user} userId={user?.id} />
       
       {/* High-End Issue Cover */}
       <header className="relative w-full aspect-[4/5] sm:aspect-[16/10] lg:aspect-[21/9] overflow-hidden">
          {sequel.banner_image ? (
            <Image
              src={sequel.banner_image}
              alt={sequel.title}
              fill
              priority
              className="object-cover scale-105"
            />
          ) : (
            <div className="w-full h-full bg-indigo-900 flex items-center justify-center">
               <Layers className="w-20 h-20 text-indigo-400 opacity-20" />
            </div>
          )}
          
          {/* Magazine Overlays */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[var(--color-background)] via-[var(--color-background)]/60 to-transparent z-10" />
          
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-end p-8 pb-12 sm:pb-[calc(var(--bottom-nav-height)+1rem)] text-center">
             <div className="max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-xl shadow-indigo-500/30">
                   <Layers className="w-3 h-3" />
                   Digital Issue
                </div>
                
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[var(--color-text)] tracking-tighter leading-[0.9] uppercase italic mb-8">
                   {sequel.title}
                </h1>

                {sequel.description && (
                  <p className="text-sm sm:text-lg font-serif italic text-[var(--color-text)] opacity-80 max-w-2xl mx-auto leading-relaxed">
                    {sequel.description}
                  </p>
                )}
             </div>
          </div>
       </header>

       {/* Issue Contents Matrix */}
       <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-12">
          
          <div className="flex items-center justify-between mb-10 border-b border-[var(--color-border)] pb-6">
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-1">Assembly</span>
                <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] uppercase tracking-tight">Current Contents</h2>
             </div>
             <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-muted)] mb-1 block">Units</span>
                <span className="text-2xl font-black text-[var(--color-text)]">{safeArticles.length}</span>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
             {safeArticles.length === 0 ? (
               <div className="py-20 text-center bg-[var(--color-surface-2)] rounded-[2.5rem] border border-dashed border-[var(--color-border)]">
                  <p className="font-black text-zinc-400 uppercase tracking-widest">Issue Empty</p>
               </div>
             ) : (
               safeArticles.map((article, index) => (
                 <Link 
                   key={article.id} 
                   href={`/articles/${article.slug}`}
                   className="group block"
                 >
                   <div className="relative p-6 sm:p-8 rounded-[2rem] bg-white dark:bg-[#111b21] border border-[var(--color-border)] hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group-active:scale-[0.98] overflow-hidden flex flex-col sm:flex-row gap-6 sm:items-center">
                      {/* Big Plate Number */}
                      <div className="text-5xl sm:text-6xl font-black text-indigo-600 opacity-10 group-hover:opacity-20 transition-opacity italic absolute right-8 top-1/2 -translate-y-1/2 select-none">
                         0{index + 1}
                      </div>
                      
                      <div className="relative z-10 flex-1">
                         <div className="flex items-center gap-3 mb-3">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 text-[9px] font-black uppercase tracking-widest border border-indigo-500/10">
                               Part {index + 1}
                            </span>
                            {article.published_at && (
                               <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-widest">
                                  {new Date(article.published_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                               </span>
                            )}
                         </div>
                         <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text)] uppercase tracking-tight leading-tight group-hover:text-indigo-600 transition-colors mb-2">
                           {article.title}
                         </h3>
                         {article.excerpt && (
                           <p className="text-sm font-medium text-[var(--color-muted)] line-clamp-2 leading-relaxed max-w-2xl">
                             {article.excerpt}
                           </p>
                         )}
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center self-end sm:self-center shrink-0 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                         <Plus className="w-6 h-6 rotate-45 group-hover:rotate-0 transition-transform" />
                      </div>
                   </div>
                 </Link>
               ))
             )}
          </div>
       </main>

       {/* Issue Footer */}
       <footer className="max-w-4xl mx-auto px-6 mt-20 text-center py-12 border-t border-[var(--color-border)]">
          <div className="font-serif italic text-lg text-[var(--color-muted)] mb-4">
             End of {sequel.title}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">© Sathyadhare Online Registry</p>
       </footer>

    </div>
  );
}
