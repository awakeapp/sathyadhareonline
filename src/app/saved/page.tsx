import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import ArticleCard from '@/components/ui/ArticleCard';
import { Card } from '@/components/ui/Card';
import { Bookmark, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Saved Articles | Sathyadhare',
  description: 'Your saved articles on Sathyadhare Digital Journal.',
};

export const dynamic = 'force-dynamic';

export default async function SavedPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bookmarks, error } = await supabase
    .from('bookmarks')
    .select(`
      id,
      created_at,
      article:articles (
        id,
        title,
        slug,
        excerpt,
        cover_image,
        status,
        is_deleted,
        published_at,
        category:categories(name)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching bookmarks:', error);

  type ArticleRow = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_image: string | null;
    status: string;
    is_deleted: boolean;
    published_at: string;
    category?: { name: string } | { name: string }[] | null;
  };

  // Filter to only published, non-deleted articles
  const saved = (bookmarks ?? [])
    .map((b) => b.article as unknown as ArticleRow)
    .filter((a) => a && a.status === 'published' && !a.is_deleted);

  return (
    <div className="font-sans antialiased min-h-[100svh] px-4 py-8 pb-32 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl border-t border-[var(--color-border)]">
      
      <div className="flex items-center gap-3 mb-10 px-1">
        <Bookmark className="w-8 h-8 text-[var(--color-primary)]" />
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text)] tracking-tight">Saved Articles</h1>
          <p className="text-[var(--color-muted)] text-xs font-bold uppercase tracking-widest mt-1">
            {saved.length} {saved.length === 1 ? 'Article' : 'Articles'}
          </p>
        </div>
      </div>

      {saved.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 text-center rounded-[2rem] shadow-none bg-[var(--color-surface)] border-dashed border-[var(--color-border)]">
          <FileText className="w-16 h-16 text-[var(--color-muted)] mb-6 opacity-30" />
          <p className="text-xl font-bold text-[var(--color-text)] tracking-tight">No saved articles yet</p>
          <p className="mt-2 text-[var(--color-muted)] text-sm font-medium">Bookmark articles to find them here later.</p>
          <Button asChild variant="primary" className="mt-8 shadow-none shadow-[var(--color-primary)]/20 text-black">
            <Link href="/">Browse Articles</Link>
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-5 mt-4">
          {saved.map((article) => (
             <ArticleCard key={article.id} variant="list" article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
