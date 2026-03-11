import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Bell, Layers, Check, Box, BookOpen } from 'lucide-react';
import { 
  PresenceWrapper, 
  PresenceHeader,
  PresenceCard,
  PresenceButton 
} from '@/components/PresenceUI';

export default async function EditSequelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();

  const { data: sequel, error: sequelError } = await supabase
    .from('sequels')
    .select('title, slug')
    .eq('id', id)
    .single();

  if (sequelError || !sequel) {
    return notFound();
  }

  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, published_at')
    .eq('status', 'published')
    .eq('is_deleted', false)
    .order('published_at', { ascending: false });

  if (articlesError) {
    console.error('Error fetching articles:', articlesError);
  }

  const { data: attachedArticles, error: attachedError } = await supabase
    .from('sequel_articles')
    .select('article_id, order_index')
    .eq('sequel_id', id)
    .order('order_index', { ascending: true });
    
  if (attachedError) {
    console.error('Error fetching attached articles:', attachedError);
  }

  const attachedArticleIds = new Set(attachedArticles?.map(a => a.article_id) || []);

  async function updateSequelArticlesAction(formData: FormData) {
    'use server';
    const supabaseAction = await createClient();
    const selectedArticleIds = formData.getAll('article_ids') as string[];

    await supabaseAction
      .from('sequel_articles')
      .delete()
      .eq('sequel_id', id);

    if (selectedArticleIds.length > 0) {
      const inserts = selectedArticleIds.map((articleId, index) => ({
        sequel_id: id,
        article_id: articleId,
        order_index: index,
      }));

      await supabaseAction
        .from('sequel_articles')
        .insert(inserts);
    }

    revalidatePath('/admin/sequels');
    if (sequel?.slug) {
      revalidatePath(`/sequels/${sequel.slug}`); 
    }
    redirect('/admin/sequels');
  }

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Presence"
        roleLabel="Sequence Manager · Data Linking"
        initials={initials}
        icon1={Bell}
        icon2={ChevronLeft}
        icon2Href="/admin/sequels"
      />
      
      <div className="px-5 -mt-8 pb-10 space-y-6 relative z-20 max-w-4xl mx-auto">
        
        <div className="flex items-center gap-5 mb-6">
           <div className="w-12 h-12 rounded-2xl bg-[#5c4ae4] flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <Layers className="w-6 h-6" />
           </div>
           <div>
              <h2 className="text-2xl font-black text-[#1b1929] dark:text-white uppercase tracking-tight">Manage Article Chain</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Sequence: {sequel.title}</p>
           </div>
        </div>

        <PresenceCard className="p-0 overflow-hidden">
          <form action={updateSequelArticlesAction} className="p-10 space-y-10">
            
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Available Matrix Nodes</h3>
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Temporal Order Binding</span>
               </div>
               
               <div className="space-y-3 max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-indigo-100">
                 {!articles || articles.length === 0 ? (
                   <div className="py-20 text-center flex flex-col items-center">
                      <BookOpen className="w-12 h-12 mb-4 text-indigo-100" />
                      <p className="font-black text-gray-400 uppercase tracking-widest text-sm">No Published Nodes</p>
                   </div>
                 ) : (
                   articles.map((article) => (
                     <label 
                       key={article.id} 
                       className="group flex items-center gap-6 cursor-pointer p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-transparent hover:border-[#5c4ae4] transition-all"
                     >
                       <div className="relative">
                          <input 
                            type="checkbox" 
                            name="article_ids" 
                            value={article.id} 
                            defaultChecked={attachedArticleIds.has(article.id)}
                            className="peer sr-only"
                          />
                          <div className="w-8 h-8 rounded-lg bg-white border-2 border-indigo-100 peer-checked:bg-[#5c4ae4] peer-checked:border-[#5c4ae4] transition-all flex items-center justify-center">
                             <Check className="w-5 h-5 text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all" />
                          </div>
                       </div>
                       <div className="min-w-0">
                         <span className="block text-lg font-black text-[#1b1929] dark:text-white uppercase tracking-tight group-hover:text-[#5c4ae4] transition-colors">{article.title}</span>
                         <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                           Broadcasted · {new Date(article.published_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </span>
                       </div>
                     </label>
                   ))
                 )}
               </div>
            </div>

            <div className="pt-10 border-t border-indigo-50 dark:border-white/5 flex justify-end">
               <button 
                type="submit" 
                className="h-16 px-12 bg-[#5c4ae4] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
              >
                <Check className="w-5 h-5" /> Synchronize Sequence
              </button>
            </div>
          </form>
        </PresenceCard>
      </div>
    </PresenceWrapper>
  );
}
