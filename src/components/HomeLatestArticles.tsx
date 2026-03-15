'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ArticleCard from './ui/ArticleCard';
import { Button } from './ui/Button';
import { ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

  const loadMore = async () => {
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
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load more articles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {articles.map((item) => (
        <ArticleCard key={item.id} variant="list" article={item} />
      ))}

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            className="w-full h-14 rounded-2xl border-2 border-[var(--color-border)] text-[var(--color-text)] font-black uppercase tracking-widest hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 active:scale-95 transition-all flex items-center gap-2 group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
            ) : (
              <>
                <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" strokeWidth={3} />
                Load More Articles
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
