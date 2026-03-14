'use client';

import { useRouter } from 'next/navigation';
import { SlidersHorizontal, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useState, useEffect, useTransition } from 'react';
import ArticleCard from '@/components/ui/ArticleCard';
import HomeSearchBar from '@/components/ui/HomeSearchBar';

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

      <HomeSearchBar />

      {/* ── Sticky header zone: category pills + filter ── */}
      <div className="sticky top-[56px] z-40 bg-[var(--color-background)]/95 backdrop-blur-2xl border-b border-[var(--color-border)]">

        {/* Category pill row */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none px-4 py-3">
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

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text)] uppercase tracking-wider"
            >
              <SlidersHorizontal className="w-3 h-3" />
              {sortOrder === 'oldest' ? 'Oldest First' : 'Newest First'}
              <ChevronDown className={`w-3 h-3 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden z-50 min-w-[150px]">
                {[
                  { label: 'Newest First', value: 'newest' },
                  { label: 'Oldest First', value: 'oldest' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilterOpen(false); navigate(activeCategory, opt.value); }}
                    className={`w-full px-4 py-3 text-left text-sm font-semibold flex items-center gap-2 hover:bg-[var(--color-surface-2)] transition-colors ${
                      sortOrder === opt.value ? 'text-[#685de6]' : 'text-[var(--color-text)]'
                    }`}
                  >
                    {sortOrder === opt.value && <Check className="w-4 h-4" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
          <div className="flex flex-col gap-5">
            {initialArticles.map(article => (
              <ArticleCard key={article.id} variant="list" article={article as unknown as React.ComponentProps<typeof ArticleCard>['article']} />
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
