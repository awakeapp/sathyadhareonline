import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, History } from 'lucide-react';
import ArticleCard from '@/components/ui/ArticleCard';

export const dynamic = 'force-dynamic';

export default async function ReadingHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch unique article views, ordered by most recent
  // We use a subquery or just group by in logic if needed, 
  // but for simplicity we'll fetch the latest 50 views.
  const { data: views } = await supabase
    .from('article_views')
    .select(`
      id,
      viewed_at,
      article:articles (
        id, title, slug, excerpt, cover_image,
        status, is_deleted, published_at,
        category:categories(name),
        reactions:article_reactions(count)
      )
    `)
    .eq('user_id', user.id)
    .eq('article.status', 'published')
    .eq('article.is_deleted', false)
    .order('viewed_at', { ascending: false })
    .limit(50);

  // Group by article ID to avoid duplicates in the history list
  const seen = new Set();
  const history = (views ?? [])
    .map(v => {
      const art = Array.isArray(v.article) ? v.article[0] : v.article;
      return { ...art, viewedAt: v.viewed_at };
    })
    .filter(a => {
      if (!a || seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6">
      <header className="mb-8">
        <Link 
          href="/profile" 
          className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-primary)] mb-4 transition-colors"
        >
          <ChevronLeft size={14} strokeWidth={3} />
          Back to Profile
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <History className="text-[var(--color-primary)]" size={28} />
          <h1 className="text-3xl font-black tracking-tight text-[var(--color-text)]">Reading History</h1>
        </div>
        <p className="text-sm text-[var(--color-muted)] font-medium">
          The articles you&apos;ve read recently on Sathyadhare.
        </p>
      </header>

      {history.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-[var(--color-surface)] rounded-[2rem] border border-dashed border-[var(--color-border)]">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-4">
            <History className="w-8 h-8 text-[var(--color-muted)] opacity-20" />
          </div>
          <h2 className="text-lg font-black text-[var(--color-text)]">No history yet</h2>
          <p className="text-sm text-[var(--color-muted)] mt-1 max-w-[200px]">
            Articles you read will appear here automatically.
          </p>
          <Link href="/" className="mt-6 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white text-[11px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all">
            Start Reading
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {history.map((article) => (
            <ArticleCard key={article.id} variant="list-horizontal" article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
