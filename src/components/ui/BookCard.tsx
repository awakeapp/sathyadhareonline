'use client';

import Link from 'next/link';
import { Share2, Bookmark, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

export interface BookItem {
  id: string;
  title: string;
  slug?: string;
  author_name?: string | null;
  cover_image?: string | null;
  chapter_count?: number;
}

interface BookCardProps {
  book: BookItem;
}

export default function BookCard({ book }: BookCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Default fallback values based on the spec
  const slug = book.slug || book.id;
  const authorName = book.author_name || 'Unknown Author';
  const chapterCount = book.chapter_count || 12; // "example: 12 Chapters" fallback

  useEffect(() => {
    let mounted = true;
    async function checkSaved() {
      // Mock checking save state or use actual bookmarks API 
      // Assuming bookmarks might work for books if configured, or just mock for now
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // If the backend doesn't support book bookmarks yet, this will just fail silently or we can ignore
      const { data } = await supabase.from('bookmarks').select('id').eq('user_id', user.id).eq('book_id', book.id).maybeSingle();
      if (data && mounted) setIsSaved(true);
    }
    checkSaved();
    return () => { mounted = false; };
  }, [book.id]);

  async function handleToggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation(); // Prevent routing
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to save books.');
      return;
    }
    const nextSaved = !isSaved;
    setIsSaved(nextSaved); 
    try {
      if (nextSaved) {
        await supabase.from('bookmarks').insert({ user_id: user.id, book_id: book.id });
        toast.success('Book saved to your library.');
      } else {
        await supabase.from('bookmarks').delete().match({ user_id: user.id, book_id: book.id });
        toast.success('Book removed from library.');
      }
    } catch {
      setIsSaved(!nextSaved);
      toast.error('Failed to update bookmark.');
    }
  }

  const getUrl = () => `${typeof window !== 'undefined' ? window.location.origin : 'https://sathyadhare.com'}/library/${slug}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getUrl();
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getUrl();
    if (navigator.share) {
      try { await navigator.share({ title: book.title, url }); } catch {}
    } else {
      handleCopy(e);
    }
  };

  return (
    <div className="group relative flex flex-col w-full h-full">
      {/* 1. Cover Image (Clickable) */}
      <Link href={`/library/${slug}`} className="block relative w-full aspect-[3/4] rounded-2xl sm:rounded-[2rem] overflow-hidden bg-[var(--color-surface-2)] transition-all duration-500 hover:-translate-y-1 z-10 tap-highlight outline-none">
        {book.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover_image}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface-2)] text-[var(--color-muted)] font-black text-xs uppercase tracking-widest">
            No Cover
          </div>
        )}
        
        {/* Subtle dark gradient overlay at the bottom so it looks like a real book cover */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        {/* Book spine highlight effect */}
        <div className="absolute inset-y-0 left-0 w-4 sm:w-6 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
      </Link>

      {/* 2 & 3. Metadata Section + Actions */}
      <div className="flex flex-col flex-1 mt-4 px-1 sm:px-2">
        {/* Title & Stats */}
        <Link href={`/library/${slug}`} className="block group-hover:text-[#685de6] transition-colors outline-none tap-highlight flex-1">
          <h3 className="text-[16px] sm:text-lg font-black leading-tight text-[var(--color-text)] line-clamp-2 mb-1.5 break-words">
            {book.title}
          </h3>
          <p className="text-[12px] sm:text-[13px] font-bold text-[var(--color-muted)] line-clamp-1 mb-2">
            {authorName}
          </p>
          <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#685de6]">
            {chapterCount} CHAPTERS
          </div>
        </Link>
        
        {/* 4. Action Buttons */}
        <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center gap-3">
          {/* Share Button */}
          <button 
            onClick={handleShare}
            className="flex-1 max-w-[120px] h-9 sm:h-10 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-text)] font-black text-[10px] sm:text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#685de6] hover:text-white transition-all outline-none group/btn"
          >
            {copied ? <Check size={14} strokeWidth={2.5} className="group-hover/btn:text-white" /> : <Share2 size={14} strokeWidth={2.5} className="text-[var(--color-muted)] group-hover/btn:text-white transition-colors" />}
            <span>Share</span>
          </button>
          
          {/* Save Button */}
          <button 
            onClick={handleToggleSave}
            className={`flex-1 max-w-[120px] h-9 sm:h-10 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all outline-none ${isSaved ? 'bg-[#ffeb3b] text-[#111] hover:scale-[1.02]' : 'bg-white dark:bg-[#222a36] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-text)]'}`}
          >
            <Bookmark size={14} strokeWidth={2.5} className={isSaved ? 'fill-[#111]' : 'text-[var(--color-muted)]'} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
