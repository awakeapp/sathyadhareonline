
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { History, ArrowLeft, Calendar, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import ArticleCard from '@/components/ui/ArticleCard';

export const dynamic = 'force-dynamic';

export default async function ReadingHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const { data: views } = await supabase
    .from('article_views')
    .select(`
      id,
      viewed_at,
      article:articles (
        id, title, slug, excerpt, cover_image,
        status, is_deleted, published_at,
        author_name,
        category:categories(name)
      )
    `)
    .eq('user_id', user.id)
    .order('viewed_at', { ascending: false })
    .limit(50);

  // Group by article ID to avoid duplicates
  const seen = new Set();
  const history = (views ?? [])
    .map(v => {
      const art = Array.isArray(v.article) ? v.article[0] : v.article;
      return art ? { ...art, viewedAt: v.viewed_at } : null;
    })
    .filter((a): a is any => {
      if (!a || seen.has(a.id)) return false;
      seen.add(a.id);
      return a.status === 'published' && !a.is_deleted;
    });

  return (
    <div className="min-h-screen bg-[var(--color-background)] pt-6 sm:pt-10 pb-[calc(var(--bottom-nav-height)+1rem)] px-4 sm:px-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <Link 
            href="/profile" 
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Back to Profile
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <History size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-text)] tracking-tight">Reading History</h1>
              <p className="text-sm font-medium text-[var(--color-muted)] mt-1">Pick up right where you left off</p>
            </div>
          </div>
        </header>

        {history.length === 0 ? (
          <div className="p-16 rounded-[3rem] border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-center opacity-60">
            <BookOpen size={48} className="text-[var(--color-muted)] mb-6" />
            <h3 className="text-xl font-black mb-2">No History Yet</h3>
            <p className="text-sm font-medium max-w-xs leading-relaxed">
              Explore our journal and read articles to see your history grow here.
            </p>
            <Link href="/" className="mt-8 px-8 py-4 rounded-2xl bg-[var(--color-primary)] text-white text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
              Start Reading
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {history.map((article) => (
              <div key={article.id} className="relative group">
                {/* View Date Marker */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <ArticleCard 
                  variant="list-horizontal" 
                  article={{
                    ...article,
                    category: article.category
                  }} 
                />
                
                <div className="absolute bottom-4 right-6 pointer-events-none flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--color-muted)] opacity-60">
                  <Calendar size={12} />
                  Last read {format(new Date(article.viewedAt), 'MMM dd')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
