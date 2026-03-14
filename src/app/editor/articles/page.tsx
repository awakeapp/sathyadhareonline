import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Eye, FileText, BarChart2, Bell, Sparkles } from 'lucide-react';
import { 
  PresenceWrapper, 
  PresenceHeader,
  PresenceCard,
  PresenceButton 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draft',          color: '#94a3b8' },
  in_review: { label: 'Under Review',  color: '#f59e0b' },
  published: { label: 'Published',     color: '#10b981' },
  archived:  { label: 'Archived',      color: '#8b5cf6' },
};

export default async function EditorArticlesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role').eq('id', user.id).single();

  if (!profile || profile.role !== 'editor') redirect('/login');

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, status, slug, updated_at, created_at')
    .eq('author_id', user.id)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false });

  if (error) console.error('Error fetching articles:', error);

  const articleIds = (articles ?? []).map(a => a.id);
  const viewCounts: Record<string, number> = {};

  if (articleIds.length > 0) {
    const { data: viewRows } = await supabase
      .from('article_views')
      .select('article_id')
      .in('article_id', articleIds);

    for (const row of viewRows ?? []) {
      viewCounts[row.article_id] = (viewCounts[row.article_id] ?? 0) + 1;
    }
  }

  const initials = (profile?.full_name || 'E').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Presence"
        roleLabel={`Author Dashboard · ${articles?.length ?? 0} Articles`}
        initials={initials}
        icon1Node={<Bell className="w-6 h-6" strokeWidth={1.25} />}
        icon2Node={<Plus className="w-6 h-6" strokeWidth={1.25} />}
        icon2Href="/editor/articles/new"
      />
      
      <div className="px-5 -mt-12 pb-10 space-y-6 relative z-20 max-w-4xl mx-auto">
        
        {/* Workflow Legend */}
        <PresenceCard className="bg-[#f0f2ff] dark:bg-indigo-500/5 border-none p-5 flex flex-wrap gap-4 items-center justify-center">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">{meta.label}</span>
            </div>
          ))}
        </PresenceCard>

        {/* Article Grid */}
        {!articles || articles.length === 0 ? (
          <PresenceCard className="py-24 text-center border-dashed border-2 border-indigo-100 flex flex-col items-center">
            <FileText className="w-16 h-16 mb-5 text-indigo-100" />
            <p className="font-black text-xl text-gray-400 uppercase tracking-widest">No Articles Found</p>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2">Start writing your first article now.</p>
          </PresenceCard>
        ) : (
          <div className="space-y-4">
            {articles.map(article => {
              const status = article.status ?? 'draft';
              const meta   = STATUS_META[status] || STATUS_META.draft;
              const views  = viewCounts[article.id] ?? 0;

              return (
                <PresenceCard key={article.id} noPadding className="group overflow-hidden">
                   <div className="flex items-stretch min-h-[100px]">
                      {/* Status Strip */}
                      <div className="w-2 shrink-0 transition-opacity group-hover:opacity-60" style={{ backgroundColor: meta.color }} />
                      
                      <div className="flex-1 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                         <div className="flex items-center gap-5 min-w-0 flex-1">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-[#5c4ae4] shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                               <Sparkles className="w-7 h-7" />
                            </div>
                            <div className="min-w-0">
                               <h2 className="text-xl font-black text-[#1b1929] dark:text-white uppercase tracking-tight truncate group-hover:text-[#5c4ae4] transition-colors">{article.title}</h2>
                               <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  <span className="px-3 py-1 rounded-lg bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400 border border-gray-100">
                                    {meta.label}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em]">
                                     <BarChart2 className="w-3 h-3" /> {views.toLocaleString()} Views
                                  </span>
                               </div>
                            </div>
                         </div>

                         <div className="flex items-center gap-3 shrink-0">
                            {status === 'published' && article.slug && (
                              <Link href={`/articles/${article.slug}`} target="_blank">
                                <button className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                   <Eye className="w-5 h-5" />
                                </button>
                              </Link>
                            )}
                            <Link href={`/editor/articles/${article.id}/edit`}>
                               <PresenceButton className="px-8 h-12 bg-indigo-50 border-none text-[#5c4ae4] hover:bg-[#5c4ae4] hover:text-white font-black text-[10px] uppercase tracking-widest">
                                  Edit Article
                               </PresenceButton>
                            </Link>
                         </div>
                      </div>
                   </div>
                </PresenceCard>
              );
            })}
          </div>
        )}
      </div>
    </PresenceWrapper>
  );
}
