'use client';

import { useState, useTransition, useMemo } from 'react';
import { 
  Plus, GripVertical, Trash2, 
  Search, Layers, FileText, Filter
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { 
  PresenceCard, 
} from '@/components/PresenceUI';
import { reorderSequelArticlesAction, toggleSequelArticleAction } from './actions';

interface Article {
  id: string;
  title: string;
  published_at: string;
}

interface AttachedArticle {
  article_id: string;
  order_index: number;
}

export default function SequelArticlesClient({ 
  sequel, 
  availableArticles,
  attachedArticles: initialAttached
}: { 
  sequel: { id: string, title: string }, 
  availableArticles: Article[],
  attachedArticles: AttachedArticle[]
}) {
  const [attached, setAttached] = useState(initialAttached);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');

  // Map IDs to actual article data for the left column (Current Issue)
  const currentArticles = useMemo(() => {
    return [...attached]
      .sort((a, b) => a.order_index - b.order_index)
      .map(at => availableArticles.find(a => a.id === at.article_id))
      .filter((a): a is Article => !!a);
  }, [attached, availableArticles]);

  // Map of attached IDs for quick lookup
  const attachedIds = useMemo(() => new Set(attached.map(a => a.article_id)), [attached]);

  // Filter available articles for the right column (Library)
  const libraryArticles = useMemo(() => {
    return availableArticles
      .filter(a => !attachedIds.has(a.id))
      .filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 10); // Limit to avoid clutter
  }, [availableArticles, attachedIds, searchQuery]);

  const handleToggle = async (articleId: string, attach: boolean) => {
    startTransition(async () => {
      const res = await toggleSequelArticleAction(sequel.id, articleId, attach);
      if (res.success) {
        if (attach) {
          const maxOrder = attached.length > 0 ? Math.max(...attached.map(a => a.order_index)) : -1;
          setAttached([...attached, { article_id: articleId, order_index: maxOrder + 1 }]);
          toast.success('Added to issue');
        } else {
          setAttached(attached.filter(a => a.article_id !== articleId));
          toast.success('Removed from issue');
        }
      } else {
        toast.error(res.error || 'Failed to update');
      }
    });
  };

  const handleReorder = async (dir: 'up' | 'down', idx: number) => {
    const sorted = [...attached].sort((a, b) => a.order_index - b.order_index);
    if (dir === 'up' && idx > 0) {
      [sorted[idx], sorted[idx - 1]] = [sorted[idx - 1], sorted[idx]];
    } else if (dir === 'down' && idx < sorted.length - 1) {
      [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
    } else {
      return;
    }

    // Refresh order indices
    const updated = sorted.map((item, i) => ({ ...item, order_index: i }));
    setAttached(updated);

    startTransition(async () => {
      const res = await reorderSequelArticlesAction(sequel.id, updated.map(a => a.article_id));
      if (!res.success) toast.error('Failed to save order');
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-[calc(var(--bottom-nav-height)+1rem)]">
      
      {/* Sequel Header */}
      <PresenceCard className="p-6 bg-zinc-900 text-white border-none overflow-hidden relative group">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-[2.5rem] bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-white/5">
            <Layers className="w-8 h-8 min-w-[44px] min-h-[44px]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">{sequel.title}</h2>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">
              Issue Assembly Console · {attached.length} Articles
            </p>
          </div>
        </div>
      </PresenceCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Current Issue Contents */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Issue Structure</h3>
             <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
               <GripVertical className="w-3 h-3" /> Reorder to set sequence
             </span>
          </div>

          <div className="space-y-3">
            {currentArticles.length === 0 ? (
              <PresenceCard className="py-24 text-center border-dashed border-2 flex flex-col items-center opacity-40">
                <FileText className="w-16 h-16 mb-5 text-indigo-100" />
                <p className="font-black text-zinc-400 uppercase tracking-widest">Issue is Empty</p>
                <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-2">Add articles from the library →</p>
              </PresenceCard>
            ) : (
              currentArticles.map((art, idx) => (
                <PresenceCard key={art?.id || idx} noPadding className="group overflow-hidden border-2 border-transparent hover:border-indigo-500/20 transition-all">
                  <div className="flex items-stretch min-h-[80px]">
                    {/* Handle Column */}
                    <div className="w-14 bg-zinc-50 dark:bg-white/5 border-r border-[var(--color-border)] flex flex-col items-center justify-center gap-1 group-hover:bg-indigo-500/5 transition-colors">
                      <button 
                        disabled={idx === 0 || isPending}
                        onClick={() => handleReorder('up', idx)}
                        className="p-1 text-zinc-400 hover:text-indigo-600 disabled:opacity-20 transition-colors"
                      >
                        <GripVertical className="w-5 h-5" />
                      </button>
                      <span className="text-[10px] font-black text-zinc-400">{idx + 1}</span>
                    </div>
                    
                    {/* Content Column */}
                    {art && (
                      <div className="flex-1 p-5 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                           <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight truncate">
                             {art.title}
                           </h4>
                           <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1 block">
                             Originally Published: {new Date(art.published_at).toLocaleDateString()}
                           </span>
                        </div>

                        <button 
                          onClick={() => handleToggle(art.id, false)}
                          disabled={isPending}
                          className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all group-hover:bg-rose-50 min-w-[44px] min-h-[44px]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </PresenceCard>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Article Library */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Article Library</h3>
             <Filter className="w-3.5 h-3.5 text-zinc-300" />
          </div>

          <PresenceCard className="p-0 overflow-hidden bg-zinc-50 dark:bg-white/5 border-none">
            <div className="p-4 border-b border-zinc-200 dark:border-white/10 relative">
               <Search className="w-4 h-4 absolute left-8 top-1/2 -translate-y-1/2 text-zinc-400" />
               <input 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 placeholder="Search registry..."
                 className="w-full h-12 pl-12 pr-4 bg-white dark:bg-zinc-950 rounded-2xl border-none text-[13px] font-bold shadow-sm placeholder-zinc-300"
               />
            </div>

            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {!libraryArticles.length && (
                <div className="py-12 text-center opacity-50">
                   <p className="text-[10px] font-black uppercase tracking-widest">No articles found</p>
                </div>
              )}
              {libraryArticles.map(art => (
                <div 
                  key={art.id}
                  className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-white/5 flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-50 truncate uppercase tracking-tight">{art.title}</p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                      {new Date(art.published_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    disabled={isPending}
                    onClick={() => handleToggle(art.id, true)}
                    className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-zinc-900 transition-all shrink-0 active:scale-90 shadow-sm min-w-[44px] min-h-[44px]"
                  >
                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          </PresenceCard>

          <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10">
             <div className="flex gap-3">
                <Filter className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                   <p className="text-[11px] font-black uppercase tracking-widest text-amber-700">Magzine Assembly Tip</p>
                   <p className="text-[10px] font-medium text-amber-600 leading-relaxed uppercase">Only published articles appear here. To include a new draft, return to the Articles section and finalize it first.</p>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
