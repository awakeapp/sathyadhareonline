'use client';

import { useRouter } from 'next/navigation';
import { SlidersHorizontal, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { useState, useEffect, useTransition } from 'react';
import ArticleCard from '@/components/ui/ArticleCard';

interface Category { name: string; slug: string; }
interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image?: string | null;
  published_at?: string | null;
  category?: { name: string } | { name: string }[] | null;
}

interface Props {
  categories: Category[];
  initialArticles: Article[];
  activeCategory: string | null;
  sortOrder: string;
}

export default function ArticlesClientPage({ categories, initialArticles, activeCategory, sortOrder }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filterOpen, setFilterOpen] = useState(false);
  const [scrollPos, setScrollPos] = useState<'top' | 'middle' | 'bottom'>('top');

  useEffect(() => {
    const onScroll = () => {
      const pos = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (pos < 50) setScrollPos('top');
      else if (pos > h - 50) setScrollPos('bottom');
      else setScrollPos('middle');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    // Trigger initially
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  const scrollBtnBase = "flex items-center justify-center w-[46px] h-[46px] rounded-[18px] bg-white/95 dark:bg-[#1a222c]/95 border border-[var(--color-border)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-[var(--color-text)] hover:bg-[var(--color-surface)] active:scale-90 transition-all pointer-events-auto backdrop-blur-xl z-50";

  function navigate(cat: string | null, sort: string) {
    const params = new URLSearchParams();
    if (cat) params.set('cat', cat);
    if (sort !== 'newest') params.set('sort', sort);
    startTransition(() => {
      router.push(`/articles${params.toString() ? `?${params}` : ''}`);
    });
  }

  return (
    <div className="min-h-[100svh] pb-0">

      {/* ── Sticky header zone: category pills + filter ── */}
      <div className="sticky z-40 bg-[var(--color-surface)]/95 backdrop-blur-xl border-b border-[var(--color-border)] transition-all" style={{ top: 'calc(var(--safe-top) + 56px)' }}>

        {/* Category pill row */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none px-4 pt-3 pb-2">
          {/* All button */}
          <button
            onClick={() => navigate(null, sortOrder)}
            className={`shrink-0 px-4 py-2 rounded-2xl text-[12px] font-black uppercase tracking-wider transition-all active:scale-95 border ${
              !activeCategory
                ? 'bg-[#685de6] text-white border-transparent shadow-md shadow-[#685de6]/25'
                : 'bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)] hover:border-[#685de6]/40'
            }`}
          >
            All
          </button>

          {categories.map(cat => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => navigate(isActive ? null : cat.slug, sortOrder)}
                className={`shrink-0 px-4 py-2 rounded-2xl text-[12px] font-black uppercase tracking-wider transition-all active:scale-95 border whitespace-nowrap ${
                  isActive
                    ? 'bg-[#685de6] text-white border-transparent shadow-md shadow-[#685de6]/25'
                    : 'bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)] hover:border-[#685de6]/40'
                }`}
              >
                {isActive && <Check className="w-3 h-3 inline mr-1" />}
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Sort / Filter bar */}
        <div className="flex items-center justify-between px-4 pb-2">
          <p className="text-[11px] text-[var(--color-muted)] font-semibold uppercase tracking-widest">
            {initialArticles.length} article{initialArticles.length !== 1 ? 's' : ''}
            {activeCategory ? ` in ${categories.find(c => c.slug === activeCategory)?.name || activeCategory}` : ''}
          </p>

          {/* Filter Trigger */}
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text)] uppercase tracking-wider active:scale-95 transition-all"
          >
            <SlidersHorizontal className="w-3 h-3" />
            Sort & Filter
            {sortOrder !== 'newest' && <span className="w-1.5 h-1.5 rounded-full bg-[#685de6] ml-0.5" />}
          </button>
        </div>
      </div>

      {/* ── Bottom Sheet Filter Modal ── */}
      {filterOpen && (
        <div 
          className="fixed inset-0 z-[1000] flex flex-col justify-end bg-black/40 backdrop-blur-sm transition-opacity" 
          onClick={() => setFilterOpen(false)}
        >
          <div
            className="bg-[var(--color-surface)] rounded-t-3xl w-full max-w-[430px] mx-auto overflow-hidden shadow-2xl animate-fade-up"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
              <h3 className="text-[17px] font-black text-[var(--color-text)] flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#685de6]" />
                Sort Options
              </h3>
              <button onClick={() => setFilterOpen(false)} className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-border)] transition-colors">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-1">Date Published</p>
              
              <button
                onClick={() => { navigate(activeCategory, 'newest'); setFilterOpen(false); }}
                className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl border transition-all ${
                  sortOrder === 'newest' 
                    ? 'bg-[#685de6]/10 border-[#685de6]/30 text-[#685de6] shadow-sm' 
                    : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                <span className="font-bold text-sm">Newest First</span>
                <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${sortOrder === 'newest' ? 'border-[#685de6]' : 'border-[var(--color-muted)]/40'}`}>
                  {sortOrder === 'newest' && <div className="w-2.5 h-2.5 rounded-full bg-[#685de6]" />}
                </div>
              </button>

              <button
                onClick={() => { navigate(activeCategory, 'oldest'); setFilterOpen(false); }}
                className={`flex items-center justify-between w-full px-4 py-3.5 rounded-2xl border transition-all ${
                  sortOrder === 'oldest' 
                    ? 'bg-[#685de6]/10 border-[#685de6]/30 text-[#685de6] shadow-sm' 
                    : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                <span className="font-bold text-sm">Oldest First</span>
                <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${sortOrder === 'oldest' ? 'border-[#685de6]' : 'border-[var(--color-muted)]/40'}`}>
                  {sortOrder === 'oldest' && <div className="w-2.5 h-2.5 rounded-full bg-[#685de6]" />}
                </div>
              </button>
            </div>
            
            <div className="px-5 pt-2 pb-2">
               <button 
                 onClick={() => setFilterOpen(false)}
                 className="w-full py-4 rounded-2xl bg-[#685de6] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-[#685de6]/25 active:scale-95 transition-all"
               >
                 Show {initialArticles.length} Results
               </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Article list ── */}
      <div className="px-4 pt-4 max-w-lg mx-auto sm:max-w-2xl lg:max-w-3xl">
        {isPending ? (
          <div className="flex flex-col gap-4 animate-pulse">
            {[1,2,3,4].map(n => (
              <div key={n} className="h-28 rounded-2xl bg-[var(--color-surface-2)]" />
            ))}
          </div>
        ) : initialArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[var(--color-surface-2)] flex items-center justify-center mb-4">
              <SlidersHorizontal className="w-7 h-7 text-[var(--color-muted)]" />
            </div>
            <h2 className="text-lg font-black text-[var(--color-text)] mb-1">No Articles Found</h2>
            <p className="text-sm text-[var(--color-muted)]">Try a different category or remove the filter.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {initialArticles.map(article => (
              <ArticleCard key={article.id} variant="list-horizontal" article={article as unknown as React.ComponentProps<typeof ArticleCard>['article']} />
            ))}
          </div>
        )}
      </div>

      {/* ── Scroll Buttons ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scroll-btn { animation: fade-in-scale 0.2s ease-out forwards; }
      `}} />
      <div
        className="fixed right-4 z-[90] flex flex-col gap-3 pointer-events-none"
        style={{ bottom: 'calc(60px + env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        {scrollPos !== 'top' && (
          <button
            onClick={scrollToTop}
            className={`${scrollBtnBase} animate-scroll-btn`}
            title="Scroll to Top"
          >
            <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
          </button>
        )}
        {scrollPos !== 'bottom' && initialArticles.length > 3 && (
          <button
            onClick={scrollToBottom}
            className={`${scrollBtnBase} animate-scroll-btn`}
            title="Scroll to Bottom"
          >
            <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
