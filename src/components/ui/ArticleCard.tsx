'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Share2, Link as LinkIcon, Bookmark, Check, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { haptics } from '@/lib/haptics';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

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
  reading_time?: string;
  type?: 'article' | 'book';
  reactions?: { count: number }[];
  like_count?: number;
  author?: { full_name: string } | null;
}

interface ArticleCardProps {
  article: Article;
  variant?: 'list' | 'list-horizontal' | 'grid-dark' | 'grid-white';
  href?: string;
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

function HorizontalCard({ 
  article, readTime, date, categoryName, href, 
  isSaved, copied, handleToggleSave, handleShare, handleCopy 
}: { 
  article: Article, readTime: string, date: string | null, categoryName: string | null, href?: string,
  isSaved: boolean, copied: boolean, handleToggleSave: (e: React.MouseEvent) => void,
  handleShare: (e: React.MouseEvent) => void, handleCopy: (e: React.MouseEvent) => void
}) {
  const linkHref = href || `/articles/${article.slug}`;

  return (
    <div className="group relative block w-full">
      <Card hoverable className="relative rounded-[2rem] border-transparent bg-white dark:bg-[#1a222c] overflow-visible flex flex-col p-3 gap-4 group-hover:bg-gray-50/80 dark:group-hover:bg-[#222a36] transition-colors">
        
        <div className="flex flex-row gap-4">
          {/* Left: Image Side */}
          <Link href={linkHref} className="relative shrink-0 block w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] transition-transform">
            <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-[var(--color-surface-2)] relative">
              {article.cover_image ? (
                <Image
                  src={article.cover_image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 640px) 110px, 130px"
                  className="object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                />
              ) : (
                <div className="absolute inset-0 bg-[var(--color-surface-2)]" />
              )}
            </div>
            {/* Category badge overlaid on center bottom of image */}
            {categoryName && (
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10 w-max max-w-[95%]">
                <span className="block px-3 py-1 rounded-[10px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white bg-black/70 backdrop-blur-md border border-white/20 truncate text-center">
                  {categoryName}
                </span>
              </div>
            )}
          </Link>

          <div className="flex flex-col flex-1 py-1 min-w-0 justify-center">
            <Link href={linkHref} className="block pr-3">
              <h3 className="text-[15px] sm:text-[17px] font-black leading-[1.3] text-[var(--color-text)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors mb-1.5 break-words">
                {article.title}
              </h3>
              {article.author?.full_name ? (
                <p className="text-[var(--color-muted)] text-[11px] sm:text-xs font-bold flex items-center gap-1.5 mt-1">
                  <span className="opacity-60 font-medium">By</span>
                  <span className="text-[var(--color-primary)]">{article.author.full_name}</span>
                </p>
              ) : (
                <p className="text-[var(--color-muted)] text-[11px] sm:text-xs font-bold flex items-center gap-1.5 mt-1">
                  <span className="opacity-60 font-medium">By</span>
                  <span className="text-[var(--color-primary)]">Sathyadhare</span>
                </p>
              )}
            </Link>
            
            <div className="mt-3 flex flex-col gap-2 pt-2 border-t border-[var(--color-border)] pl-1 pr-1">
              <div className="flex items-center text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] opacity-80 gap-1.5 shrink-0">
                {article.title.toUpperCase().includes('SEQUEL') ? (
                  <><span className="text-[#685de6]">SEQUEL</span><span className="opacity-40">|</span></>
                ) : null}
                {date && <span>{date}</span>}
                {date && <span className="opacity-40">|</span>}
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {readTime}
                </span>
              </div>

              {/* Action Icons Row */}
              <div className="flex items-center justify-between opacity-90 mt-1">
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase text-rose-500">
                  <Heart size={12} strokeWidth={3} className="fill-current" />
                  {article.like_count ?? (Array.isArray(article.reactions) ? article.reactions[0]?.count : 0) ?? 0}
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={handleShare} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all shrink-0" title="Share">
                    <Share2 size={12} strokeWidth={2.5} />
                  </button>
                  <button onClick={handleCopy} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all shrink-0 ${copied ? 'bg-green-500/10 text-green-500' : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10'}`} title="Copy Link">
                    {copied ? <Check size={12} strokeWidth={3} /> : <LinkIcon size={12} strokeWidth={2.5} />}
                  </button>
                  <button onClick={handleToggleSave} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all shrink-0 border ${isSaved ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/30' : 'bg-transparent text-[var(--color-muted)] hover:text-[var(--color-primary)] border-[var(--color-border)]'}`} title={isSaved ? "Saved" : "Save article"}>
                    <Bookmark size={12} strokeWidth={2.5} className={isSaved ? 'fill-current' : ''} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function ArticleCard({ article, variant = 'list', href }: ArticleCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const categoryName = getCategory(article);
  const readTime = calcReadTime(article);
  const date = formatDate(article.published_at);
  const linkHref = href || `/articles/${article.slug}`;

  useEffect(() => {
    let mounted = true;
    async function checkSaved() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase.from('bookmarks').select('id').eq('user_id', user.id).match(
        article.type === 'book' ? { book_id: article.id } : { article_id: article.id }
      ).maybeSingle();
      if (data && mounted) setIsSaved(true);
    }
    checkSaved();
    return () => { mounted = false; };
  }, [article.id, article.type]);

  async function handleToggleSave(e: React.MouseEvent) {
    e.preventDefault();
    haptics.impact('light');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to save items.');
      return;
    }
    const nextSaved = !isSaved;
    setIsSaved(nextSaved); // optimistic UI
    try {
      const match = article.type === 'book' ? { book_id: article.id } : { article_id: article.id };
      if (nextSaved) {
        await supabase.from('bookmarks').insert({ user_id: user.id, ...match });
        haptics.success();
        toast.success(article.type === 'book' ? 'Book saved to collection.' : 'Saved to your collection.');
      } else {
        await supabase.from('bookmarks').delete().match({ user_id: user.id, ...match });
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

  if (variant === 'list-horizontal') {
    return (
      <HorizontalCard 
        article={article} 
        readTime={readTime} 
        date={date} 
        categoryName={categoryName} 
        href={href}
        isSaved={isSaved}
        copied={copied}
        handleToggleSave={handleToggleSave}
        handleShare={handleShare}
        handleCopy={handleCopy}
      />
    );
  }

  if (variant === 'list') {
    const linkHref = href || `/articles/${article.slug}`;
    return (
      <Link href={linkHref} className="group relative block w-full outline-none transition-transform">
        <Card hoverable className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-none overflow-hidden h-full flex flex-col group-hover:bg-[var(--color-surface-2)] transition-colors">
          {/* Image Side */}
          <div className="relative block w-full aspect-[16/9] overflow-hidden">
            {article.cover_image ? (
              <Image
                src={article.cover_image}
                alt={article.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 500px, 800px"
                className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="absolute inset-0 bg-[var(--color-surface-2)]" />
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Float Save Button */}
            <div className="absolute top-2 right-2 z-20">
              <button 
                onClick={handleToggleSave}
                className={`w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md transition-all shadow-lg active:scale-90 ${isSaved ? 'bg-[var(--color-primary)] text-white' : 'bg-white/20 text-white hover:bg-white/40 border border-white/20'} min-w-[44px] min-h-[44px]`}
              >
                <Bookmark size={14} strokeWidth={2.5} className={isSaved ? 'fill-current' : ''} />
              </button>
            </div>

            {/* Category badge overlaid on image */}
            {categoryName && (
              <div className="absolute bottom-3 left-3 z-10 transition-transform group-hover:translate-x-1">
                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white bg-[var(--color-primary)]/80 backdrop-blur-md border border-white/10">
                  {categoryName}
                </span>
              </div>
            )}
          </div>

          {/* Content Side */}
          <div className="flex flex-col flex-1 px-4 py-4">
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
          </div>
        </Card>
      </Link>
    );
  }

  // Grid Style
  return (
    <Link href={linkHref} className="group flex flex-col h-full outline-none transition-transform">
      <Card hoverable className="rounded-[1.75rem] border-transparent bg-transparent shadow-none h-full flex flex-col">
        {/* Image Container */}
        <div className="relative w-full aspect-[4/5] rounded-[1.75rem] overflow-hidden mb-3 bg-[var(--color-surface-2)]">
          {article.cover_image && (
            <Image
              src={article.cover_image}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 50vw, 30vw"
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
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
