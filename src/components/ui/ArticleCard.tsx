'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Share2, Link as LinkIcon, Bookmark, Check, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { haptics } from '@/lib/haptics';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

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
  reactions?: { count: number }[] | null;
  like_count?: number;
}

interface ArticleCardProps {
  article: Article;
  variant?: 'list' | 'list-horizontal' | 'grid-dark' | 'grid-white';
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

function HorizontalCard({ article, readTime, date, categoryName }: { article: Article, readTime: string, date: string | null, categoryName: string | null }) {
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkSaved() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase.from('bookmarks').select('id').eq('user_id', user.id).eq('article_id', article.id).maybeSingle();
      if (data && mounted) setIsSaved(true);
    }
    checkSaved();
    return () => { mounted = false; };
  }, [article.id]);

  async function handleToggleSave(e: React.MouseEvent) {
    e.preventDefault();
    haptics.impact('light');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to save articles.');
      return;
    }
    const nextSaved = !isSaved;
    setIsSaved(nextSaved); // optimistic UI
    try {
      if (nextSaved) {
        await supabase.from('bookmarks').insert({ user_id: user.id, article_id: article.id });
        haptics.success();
        toast.success('Saved to your collection.');
      } else {
        await supabase.from('bookmarks').delete().match({ user_id: user.id, article_id: article.id });
        haptics.impact('medium');
        toast.success('Removed from collection.');
      }
    } catch {
      setIsSaved(!nextSaved); // rollback
      haptics.error();
      toast.error('Failed to update bookmark.');
    }
  }

  const getUrl = () => `${typeof window !== 'undefined' ? window.location.origin : 'https://sathyadhare.com'}/articles/${article.slug}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    haptics.impact('light');
    const url = getUrl();
    try { await navigator.clipboard.writeText(url); haptics.success(); } catch { /* ignore */ }
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    haptics.impact('medium');
    const url = getUrl();
    if (navigator.share) {
      try { await navigator.share({ title: article.title, url }); haptics.success(); } catch {}
    } else {
      handleCopy(e);
    }
  };

  return (
    <div className="group relative block w-full mb-3">
      <Card hoverable className="relative rounded-[2rem] border-transparent bg-white dark:bg-[#1a222c] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] overflow-visible flex flex-col p-3 gap-4 group-hover:bg-gray-50/80 dark:group-hover:bg-[#222a36] transition-colors">
        
        <div className="flex flex-row gap-4">
          {/* Left: Image Side */}
          <Link href={`/articles/${article.slug}`} className="relative shrink-0 block w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] transition-all active:scale-95 active:rotate-1">
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
                <span className="block px-3 py-1 rounded-[10px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white bg-black/70 backdrop-blur-md border border-white/20 shadow-lg truncate text-center">
                  {categoryName}
                </span>
              </div>
            )}
          </Link>

          <div className="flex flex-col flex-1 py-1 min-w-0 justify-center">
            <Link href={`/articles/${article.slug}`} className="block pr-3">
              <h3 className="text-[15px] sm:text-[17px] font-black leading-[1.3] text-[var(--color-text)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors mb-1.5 break-words">
                {article.title}
              </h3>
              {article.excerpt && (
                <p className="text-[var(--color-muted)] text-[11px] sm:text-xs leading-relaxed line-clamp-2 font-semibold break-words">
                  {article.excerpt}
                </p>
              )}
            </Link>
            
            <div className="mt-3 flex flex-wrap items-center justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] pt-3 border-t border-[var(--color-border)] opacity-80 pl-1 mr-2">
              <div className="flex items-center flex-wrap gap-1.5 shrink-0">
                {article.title.toUpperCase().includes('SEQUEL') ? (
                  <><span className="text-[#685de6]">SEQUEL</span><span className="opacity-40">|</span></>
                ) : null}
                {date && <span>{date}</span>}
                {date && <span className="opacity-40">|</span>}
                <span className="flex items-center gap-1 shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {readTime}
                </span>
                <span className="opacity-40">|</span>
                <span className="flex items-center gap-1 shrink-0 text-rose-500/80">
                  <Heart size={10} strokeWidth={3} className="fill-current" />
                  {article.like_count ?? (Array.isArray(article.reactions) ? article.reactions[0]?.count : 0) ?? 0}
                </span>
              </div>

              {/* Share & Copy logic inline */}
              <div className="flex items-center gap-2 pl-2">
                <button onClick={handleShare} className="w-6 h-6 flex items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[#685de6] active:scale-90 transition-all shrink-0">
                  <Share2 size={11} strokeWidth={2.5} />
                </button>
                <button onClick={handleCopy} className={`w-6 h-6 flex items-center justify-center rounded-lg bg-[var(--color-surface-2)] transition-all active:scale-90 shrink-0 ${copied ? 'text-green-500' : 'text-[var(--color-muted)] hover:text-[#685de6]'}`}>
                  {copied ? <Check size={11} strokeWidth={3} /> : <LinkIcon size={11} strokeWidth={2.5} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bookmark floating button bottom-right matching the image */}
        <div className="absolute -bottom-3 right-5 z-20">
          <button
            onClick={handleToggleSave}
            className={`w-8 h-8 rounded-[0.85rem] shadow-[0_4px_12px_rgba(100,100,100,0.1)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all ${isSaved ? 'bg-[#ffeb3b] text-[#111] shadow-[0_4px_12px_rgba(255,235,59,0.3)]' : 'bg-white dark:bg-[#222a36] text-[var(--color-muted)] border border-[var(--color-border)]'}`}
            title={isSaved ? "Saved" : "Save article"}
          >
            <Bookmark size={14} strokeWidth={2.5} className={isSaved ? 'fill-[#111]' : ''} />
          </button>
        </div>

      </Card>
    </div>
  );
}

export default function ArticleCard({ article, variant = 'list' }: ArticleCardProps) {
  const categoryName = getCategory(article);
  const readTime = calcReadTime(article);
  const date = formatDate(article.published_at);

  if (variant === 'list-horizontal') {
    return <HorizontalCard article={article} readTime={readTime} date={date} categoryName={categoryName} />;
  }

  if (variant === 'list') {
    return (
      <div className="group relative block w-full mb-3">
        <Card hoverable className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-none overflow-hidden h-full flex flex-col group-hover:bg-[var(--color-surface-2)] transition-colors">
          {/* Image Side */}
          <Link href={`/articles/${article.slug}`} className="relative block w-full aspect-[16/9] overflow-hidden transition-all active:scale-[0.98] active:translate-y-0.5">
            {article.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.cover_image}
                alt={article.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="absolute inset-0 bg-[var(--color-surface-2)]" />
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {/* Category badge overlaid on image */}
            {categoryName && (
              <div className="absolute bottom-3 left-3 z-10">
                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white bg-[var(--color-primary)]/80 backdrop-blur-md border border-white/10 shadow-lg">
                  {categoryName}
                </span>
              </div>
            )}
          </Link>

          {/* Content Side */}
          <div className="flex flex-col flex-1 px-4 py-4">
            <Link href={`/articles/${article.slug}`} className="block">
              <h3 className="text-[17px] font-black leading-snug text-[var(--color-text)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                {article.title}
              </h3>
              {article.excerpt && (
                <p className="text-[var(--color-muted)] text-sm leading-relaxed line-clamp-2 mt-1.5 font-medium">
                  {article.excerpt}
                </p>
              )}
              <div className="mt-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] opacity-80">
                {date && <span>{date}</span>}
                {date && <span className="opacity-30">•</span>}
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {readTime}
                </span>
                <span className="opacity-30">•</span>
                <span className="flex items-center gap-1 text-rose-500/80">
                  <Heart size={11} strokeWidth={2.5} className="fill-current" />
                  {article.like_count ?? (Array.isArray(article.reactions) ? article.reactions[0]?.count : 0) ?? 0}
                </span>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Grid Style
  return (
    <Link href={`/articles/${article.slug}`} className="group flex flex-col h-full outline-none transition-all active:scale-95 active:translate-y-1">
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
