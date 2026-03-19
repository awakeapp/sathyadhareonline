'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Heart } from 'lucide-react';
import { toast } from '@/lib/toast';

interface ArticleLikeButtonProps {
  articleId: string;
  initialLikeCount?: number;
}

export default function ArticleLikeButton({ articleId, initialLikeCount = 0 }: ArticleLikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(user?.id ?? null);

      if (user) {
        const { data } = await supabase
          .from('article_reactions')
          .select('id')
          .eq('article_id', articleId)
          .eq('user_id', user.id)
          .eq('type', 'like')
          .maybeSingle();
        if (mounted && data) setLiked(true);
      }

      // Get total like count
      const { count } = await supabase
        .from('article_reactions')
        .select('id', { count: 'exact', head: true })
        .eq('article_id', articleId)
        .eq('type', 'like');
      if (mounted && count !== null) setLikeCount(count);
    }

    init();
    return () => { mounted = false; };
  }, [articleId]);

  const handleToggle = useCallback(async () => {
    if (isLoading) return;

    if (!userId) {
      toast.error('Please sign in to like articles.');
      return;
    }

    setIsLoading(true);
    const next = !liked;
    setLiked(next);
    setLikeCount(c => next ? c + 1 : Math.max(0, c - 1));

    if (next) {
      setBurst(true);
      import('@/lib/haptics').then(({ haptics }) => haptics.impact('medium'));
      setTimeout(() => setBurst(false), 600);
    } else {
      import('@/lib/haptics').then(({ haptics }) => haptics.impact('light'));
    }

    try {
      const supabase = createClient();
      if (next) {
        await supabase.from('article_reactions').upsert({
          article_id: articleId,
          user_id: userId,
          type: 'like',
        }, { onConflict: 'article_id,user_id,type' });
      } else {
        await supabase.from('article_reactions').delete()
          .eq('article_id', articleId).eq('user_id', userId).eq('type', 'like');
      }
    } catch {
      // revert
      setLiked(!next);
      setLikeCount(c => !next ? c + 1 : Math.max(0, c - 1));
      toast.error('Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  }, [articleId, liked, isLoading, userId]);

  return (
    <button
      onClick={handleToggle}
      className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 select-none
        ${liked
          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
          : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] border border-[var(--color-border)] hover:text-rose-500 hover:border-rose-500/30'
        }`}
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      <span className="relative">
        <Heart
          size={14}
          strokeWidth={2.5}
          className={`transition-all duration-200 ${liked ? 'fill-rose-500 text-rose-500 scale-110' : 'group-hover:scale-110'}`}
        />
        {/* Burst rings */}
        {burst && (
          <>
            <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-75 scale-150" />
          </>
        )}
      </span>
      <span>{likeCount > 0 ? likeCount.toLocaleString() : 'Like'}</span>
    </button>
  );
}
