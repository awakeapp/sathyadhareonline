'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Bookmark } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image?: string | null;
  category?: { name: string } | { name: string }[] | null;
  published_at?: string | null;
  read_time?: number | null;
  content?: string | null;   // if passed, used for more accurate read time
}

interface ArticleCardProps {
  article: Article;
  variant?: 'list' | 'grid-dark' | 'grid-white';
}

function getCategory(article: Article) {
  const cat = Array.isArray(article.category) ? article.category[0] : article.category;
  return cat?.name ?? null;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).toUpperCase();
}

/* Unified read-time: uses content if available, else excerpt, else DB value, else 3 */
function calcReadTime(article: Article): string {
  const WPM = 200;
  if (article.content) {
    const text = article.content.replace(/<[^>]*>?/gm, '');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / WPM))} MIN READ`;
  }
  if (article.excerpt) {
    const words = article.excerpt.trim().split(/\s+/).filter(Boolean).length;
    // Excerpts are short; multiply to approximate full article
    const approxMins = Math.max(1, Math.ceil(words * 10 / WPM));
    return `${approxMins} MIN READ`;
  }
  if (article.read_time) return `${article.read_time} MIN READ`;
  return '3 MIN READ';
}

export default function ArticleCard({ article, variant = 'list' }: ArticleCardProps) {
  const categoryName = getCategory(article);
  const readTime = calcReadTime(article);
  const date = formatDate(article.published_at);

  if (variant === 'list') {
    return (
      <div className="group relative block w-full mb-3">
        <Card hoverable className="relative rounded-[2rem] border-transparent bg-white dark:bg-[#1a222c] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] overflow-visible flex flex-row p-3 gap-4 group-hover:bg-gray-50/80 dark:group-hover:bg-[#222a36] transition-colors">
          
          {/* Left: Image Side */}
          <Link href={`/articles/${article.slug}`} className="relative shrink-0 block w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] tap-highlight">
            <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-[var(--color-surface-2)] relative shadow-sm">
              {article.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.cover_image}
                  alt={article.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                />
              ) : (
                <div className="absolute inset-0 bg-[var(--color-surface-2)]" />
              )}
            </div>
            {/* Category badge overlaid on center bottom of image */}
            {categoryName && (
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10 w-max max-w-[95%]">
                <span className="block px-3 py-1 rounded-[10px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#111] bg-[#ffeb3b] shadow-md truncate text-center">
                  {categoryName}
                </span>
              </div>
            )}
          </Link>

          {/* Right: Content Side */}
          <div className="flex flex-col flex-1 py-1 min-w-0 justify-center">
            <Link href={`/articles/${article.slug}`} className="block tap-highlight pr-2">
              <h3 className="text-[15px] sm:text-[17px] font-black leading-[1.3] text-[var(--color-text)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors mb-1.5 break-words">
                {article.title}
              </h3>
              {article.excerpt && (
                <p className="text-[var(--color-muted)] text-[11px] sm:text-xs leading-relaxed line-clamp-3 font-semibold break-words">
                  {article.excerpt}
                </p>
              )}
            </Link>
            
            <div className="mt-3 flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] pt-3 border-t border-[var(--color-border)] opacity-80">
              {article.title.toUpperCase().includes('SEQUEL') ? (
                <><span>SEQUEL</span><span className="opacity-40">|</span></>
              ) : null}
              {date && <span>{date}</span>}
              {date && <span className="opacity-40">|</span>}
              <span className="flex items-center gap-1 shrink-0">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {readTime}
              </span>
            </div>
          </div>

          {/* Bookmark floating button bottom-right matching the image */}
          <div className="absolute -bottom-3 right-5 z-20">
            <button
              onClick={e => { e.preventDefault(); /* add save handler */ }}
              className="w-8 h-8 rounded-xl bg-[#ffeb3b] text-[#111] shadow-[0_4px_12px_rgba(255,235,59,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
              <Bookmark size={14} strokeWidth={2.5} className="fill-[#111]" />
            </button>
          </div>

        </Card>
      </div>
    );
  }

  // Grid Style
  return (
    <Link href={`/articles/${article.slug}`} className="group flex flex-col tap-highlight h-full outline-none">
      <Card hoverable className="rounded-[1.75rem] border-transparent bg-transparent shadow-none h-full flex flex-col">
        {/* Image Container */}
        <div className="relative w-full aspect-[4/5] rounded-[1.75rem] overflow-hidden mb-3 bg-[var(--color-surface-2)]">
          {article.cover_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.cover_image}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        {/* Meta Text strictly outside the image area */}
        <div className="px-1 flex flex-col flex-1 pb-1">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5 text-[var(--color-primary)]">
            {categoryName || 'ARTICLE'}
          </p>
          <h3 className="text-sm font-bold leading-snug line-clamp-2 text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors mb-2">
            {article.title}
          </h3>
          <div className="mt-auto text-[9px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
            {date && `${date}`}
          </div>
        </div>
      </Card>
    </Link>
  );
}
