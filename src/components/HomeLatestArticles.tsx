'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ArticleCard from './ui/ArticleCard';
import { toast } from 'sonner';
import { ArticleCardSkeleton } from './ui/Skeleton';
import { useEffect, useRef, useCallback } from 'react';

interface ArticleWithCategory {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image?: string | null;
  published_at?: string | null;
  category: { name: string } | { name: string }[] | null;
  reactions?: { count: number }[];
}

interface HomeLatestArticlesProps {
  initialArticles: ArticleWithCategory[];
}

export default function HomeLatestArticles({ initialArticles }: HomeLatestArticlesProps) {
  const [articles, setArticles] = useState<ArticleWithCategory[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialArticles.length === 6);
  const supabase = createClient();

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const lastArticle = articles[articles.length - 1];
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, cover_image, published_at, category:categories(name), reactions:article_reactions(count)')
        .eq('article_reactions.type', 'like')
        .eq('status', 'published')
        .eq('is_deleted', false)
        .lt('published_at', lastArticle.published_at)
        .order('published_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      if (data && data.length > 0) {
        setArticles(prev => [...prev, ...data as unknown as ArticleWithCategory[]]);
        if (data.length < 6) setHasMore(false);
        import('@/lib/haptics').then(({ haptics }) => haptics.success());
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load more articles");
      import('@/lib/haptics').then(({ haptics }) => haptics.error());
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, articles, supabase]);

  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <div className="flex flex-col gap-5">
      {articles.map((item) => (
        <ArticleCard key={item.id} variant="list" article={item} />
      ))}

      {hasMore && (
        <div ref={observerRef} className="mt-4 flex flex-col gap-5">
          {loading && (
            <>
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
            </>
          )}
        </div>
      )}
    </div>
  );
}
