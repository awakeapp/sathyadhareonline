import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import ReadingProgress from '@/components/ReadingProgress';
import ArticleCard from '@/components/ui/ArticleCard';
import SectionHeader from '@/components/ui/SectionHeader';
import HorizontalScroller from '@/components/ui/HorizontalScroller';
import { ArticleViewTracker } from './ArticleViewTracker';
import { BookmarkButton } from './BookmarkButton';
import { revalidatePath } from 'next/cache';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export const revalidate = 60;

// ── View tracker server action ───────────────────────────────
async function trackView(articleId: string, sessionId: string): Promise<void> {
  'use server';
  if (!articleId || !sessionId) return;

  const supabase = await createClient();

  // Optional: attach the logged-in user_id if available
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('article_views').insert({
    article_id: articleId,
    session_id: sessionId,
    user_id: user?.id ?? null,
    viewed_at: new Date().toISOString(),
  });
}

// ── Bookmark server actions ──────────────────────────────────
async function saveArticle(articleId: string) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  await supabase.from('bookmarks').insert({
    user_id: user.id,
    article_id: articleId,
  });
  revalidatePath('/saved');
}

async function removeArticle(articleId: string) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('bookmarks').delete()
    .eq('user_id', user.id)
    .eq('article_id', articleId);
  revalidatePath('/saved');
}

interface Props { params: Promise<{ slug: string }> }

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).toUpperCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: article } = await supabase
    .from('articles').select('title, excerpt, cover_image').eq('slug', slug).single();
  if (!article) return {};
  return {
    title: `${article.title} | Sathyadhare`,
    description: article.excerpt || '',
    openGraph: { title: article.title, description: article.excerpt || '', images: article.cover_image ? [article.cover_image] : [] },
    twitter: { card: 'summary_large_image', title: article.title, description: article.excerpt || '', images: article.cover_image ? [article.cover_image] : [] },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article, error } = await supabase
    .from('articles')
    .select('*, author:profiles(id, full_name), category:categories(name)')
    .eq('slug', slug).single();
  if (error || !article) notFound();

  // Check initial bookmark state
  const { data: { user } } = await supabase.auth.getUser();
  let initialSaved = false;
  if (user) {
    const { data: bookmark } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('article_id', article.id)
      .single();
    if (bookmark) initialSaved = true;
  }

  const { data: related } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image, published_at, category:categories(name)')
    .eq('category_id', article.category_id).eq('status', 'published').neq('id', article.id).limit(4);

  const readTime = article.read_time ? `${article.read_time} MIN READ` : '3 MIN READ';
  const category = Array.isArray(article.category) ? article.category[0] : article.category;
  const categoryName = category?.name || 'ARTICLE';
  const date = formatDate(article.published_at || article.created_at);

  return (
    <div className="font-sans antialiased min-h-[100svh] px-4 py-8 pb-32 max-w-lg mx-auto sm:max-w-2xl lg:max-w-3xl">
      {/* Specifically re-enable scrollbars for the reading view */}
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar {
          display: block !important;
          width: 6px !important;
          height: 6px !important;
        }
        * {
          scrollbar-width: thin !important;
          -ms-overflow-style: auto !important;
        }
        ::-webkit-scrollbar-track {
          background: transparent !important;
        }
        ::-webkit-scrollbar-thumb {
          background: var(--color-border) !important;
          border-radius: 10px !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--color-muted) !important;
        }
      `}} />

      {/* View tracker — fires once per article per browser session */}
      <ArticleViewTracker articleId={article.id} trackView={trackView} />
      <ReadingProgress />

      {/* Header Info */}
      <header className="mb-6 space-y-4">
        {categoryName && (
          <span className="inline-block px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] leading-none bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
            {categoryName}
          </span>
        )}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--color-text)] leading-[1.15] tracking-tight mt-0">
          {article.title}
        </h1>
        <div className="flex items-center justify-between mt-2 pt-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
            {date && <span>{date}</span>}
            {date && <span>•</span>}
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{readTime}</span>
            </span>
          </div>

          {user && (
            <BookmarkButton
              articleId={article.id}
              initialSaved={initialSaved}
              saveAction={saveArticle}
              removeAction={removeArticle}
            />
          )}
        </div>
      </header>

      {/* Hero Image */}
      {article.cover_image && (
        <Card className="w-full aspect-[4/3] sm:aspect-video rounded-[2rem] overflow-hidden shadow-none border-transparent mb-10 bg-[var(--color-surface-2)]">
          <Image
            src={article.cover_image}
            alt={article.title}
            width={1200}
            height={675}
            priority
            className="w-full h-full object-cover"
          />
        </Card>
      )}

      {/* Article content — ONLY this section is copy-pasteable */}
      <div 
        className="allow-select prose-article whitespace-pre-wrap mt-6 mb-12"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Comment Section (Fake Input) */}
      <Card className="w-full mb-12 shadow-none border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]">
        <CardContent className="p-4 sm:p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex-shrink-0 flex items-center justify-center text-black font-black text-sm">
            {user?.email?.charAt(0).toUpperCase() || '?'}
          </div>
          <Input placeholder="Leave a comment..." className="border-none bg-transparent shadow-none px-0 focus-visible:ring-0 placeholder:text-[var(--color-muted)] font-semibold" />
        </CardContent>
      </Card>

      {/* Related Articles Scroller */}
      {related && related.length > 0 && (
        <div className="mt-12 pt-8 border-t border-[var(--color-border)]">
          <SectionHeader title="Related Articles" />
          <HorizontalScroller className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-4 mt-6">
            {related.map((item) => (
              <div key={item.id} style={{ minWidth: '160px', width: '45vw', maxWidth: '200px' }}>
                <ArticleCard variant="grid-dark" article={item} />
              </div>
            ))}
          </HorizontalScroller>
        </div>
      )}

    </div>
  );
}
