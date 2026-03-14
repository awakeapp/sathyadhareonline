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
import { Card } from '@/components/ui/Card';
import { CommentBox } from './CommentBox';
import ShareButtons from '@/components/ShareButtons';
import ArticleReaderControls, { CopyProtected } from './ArticleReaderControls';

function calculateReadTime(content: string) {
  const wordsPerMinute = 200;
  const noHtml = content?.replace(/<[^>]*>?/gm, '') || '';
  const words = noHtml.trim().split(/\s+/).length || 1;
  return Math.ceil(words / wordsPerMinute);
}

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
  const { data: dbArticle } = await supabase
    .from('articles').select('title, excerpt, cover_image').eq('slug', decodeURIComponent(slug)).single();
    
  if (!dbArticle) return {};
  const article = dbArticle;
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

  const { data: dbArticle, error } = await supabase
    .from('articles')
    .select('*, author:profiles(id, full_name), category:categories(name)')
    .eq('slug', decodeURIComponent(slug)).single();
    
  if (error || !dbArticle) notFound();
  const article = dbArticle;

  // Check user
  const { data: { user } } = await supabase.auth.getUser();

  // Check initial bookmark state
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

  const autoReadTime = calculateReadTime(article.content || '');
  const readTimeLabel = `${autoReadTime} MIN READ`;
  const category = Array.isArray(article.category) ? article.category[0] : article.category;
  const categoryName = category?.name || 'ARTICLE';
  const date = formatDate(article.published_at || article.created_at);

  return (
    <div className="font-sans antialiased min-h-[100svh] px-4 pb-0 max-w-lg mx-auto sm:max-w-2xl lg:max-w-3xl article-page-container">
      <style dangerouslySetInnerHTML={{ __html: `html.is-fullscreen main { padding-top: 0 !important; }` }} />
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
        /* Fade-in for article hero image */
      `}} />

      {/* View tracker — fires once per article per browser session */}
      <ArticleViewTracker articleId={article.id} trackView={trackView} />
      <ReadingProgress />

      {/* ─── Reader Controls: theme toggle, fullscreen, scroll buttons ─── */}
      {/* For privileged roles, this also renders a minimal overlay header */}
      <ArticleReaderControls />

      {/* ─── Article Header — hide in fullscreen ─── */}
      <header className="hide-in-fullscreen pt-3 pb-5 border-b border-[var(--color-border)] mb-6">

        {/* Title */}
        <h1 className="text-[1.75rem] sm:text-4xl font-black text-[var(--color-text)] leading-[1.1] tracking-tighter mb-4">
          {article.title}
        </h1>

        {/* Author + Meta row */}
        <div className="flex items-center gap-3 mb-4">
          {/* Avatar circle */}
          <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
            <svg className="w-4.5 h-4.5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-black text-[var(--color-text)] leading-none mb-1">
              {(Array.isArray(article.author) ? article.author[0] : article.author)?.full_name || 'Sathyadhare Editorial'}
            </p>
            {/* Category · Date · Read time — one compact pill row */}
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider flex-wrap">
              {categoryName && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--color-primary)] text-white font-black text-[9px] tracking-widest">
                  {categoryName}
                </span>
              )}
              {date && <>
                <span className="opacity-40">·</span>
                <span>{date}</span>
              </>}
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {readTimeLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Share + Save row — full width, balanced */}
        <ShareButtons title={article.title} slug={article.slug}>
          <BookmarkButton
            articleId={article.id}
            initialSaved={initialSaved}
            isAuthenticated={!!user}
            saveAction={saveArticle}
            removeAction={removeArticle}
          />
        </ShareButtons>
      </header>

      {/* Hero Image — reduced height for better focus on reading */}
      {article.cover_image && (
        <Card className="w-full aspect-[21/9] rounded-[2rem] overflow-hidden shadow-none border-transparent mb-10 bg-[var(--color-surface-2)]">
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

      {/* Article content — copy-protected */}
      <CopyProtected
        html={article.content}
        className="prose-article mt-6 mb-12"
      />

      {/* Comment Section */}
      <div className="hide-in-fullscreen">
        <CommentBox 
          articleId={article.id}
          isAuthenticated={!!user} 
        />

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
    </div>
  );
}
