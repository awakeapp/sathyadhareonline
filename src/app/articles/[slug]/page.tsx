import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import ReadingProgress from '@/components/ReadingProgress';
import ArticleCard from '@/components/ui/ArticleCard';
import SectionHeader from '@/components/ui/SectionHeader';
import HorizontalScroller from '@/components/ui/HorizontalScroller';
import { ArticleViewTracker } from './ArticleViewTracker';
import { BookmarkButton } from './BookmarkButton';
import { ScrollRestorer } from '@/components/ScrollRestorer';
import { revalidatePath } from 'next/cache';
import { Card } from '@/components/ui/Card';
import { CommentBox } from './CommentBox';
import ShareButtons from '@/components/ShareButtons';
import ArticleReaderControls, { CopyProtected } from './ArticleReaderControls';
import { marked } from 'marked';
import ArticleLikeButton from '@/components/ArticleLikeButton';
import ArticleReadingTools from '@/components/ArticleReadingTools';
import TableOfContents from '@/components/TableOfContents';
import ChapterNav from '@/components/ChapterNav';
import ContinueReading from './ContinueReading';
import { ReadingProgressTracker } from './ReadingProgressTracker';

// Convert Kannada digits to English digits
const KANNADA_NUMS = ['೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'];
function translateNum(str: string) {
  if (!str) return str;
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.split(KANNADA_NUMS[i]).join(i.toString());
  }
  return res;
}

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

  const { data: { user } } = await supabase.auth.getUser();

  // 1. Record the view
  await supabase.from('article_views').insert({
    article_id: articleId,
    session_id: sessionId,
    user_id: user?.id ?? null,
    viewed_at: new Date().toISOString(),
  });

  // 2. Update Streak if logged in
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('reading_streak, last_read_date')
      .eq('id', user.id)
      .single();

    if (profile) {
      const lastRead = profile.last_read_date ? new Date(profile.last_read_date) : null;
      const now = new Date();
      
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastDate = lastRead ? new Date(lastRead.getFullYear(), lastRead.getMonth(), lastRead.getDate()) : null;

      if (!lastDate || today.getTime() > lastDate.getTime()) {
        let newStreak = 1;
        
        if (lastDate) {
          const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            newStreak = (profile.reading_streak || 0) + 1;
          }
        }

        await supabase
          .from('profiles')
          .update({
            reading_streak: newStreak,
            last_read_date: now.toISOString(),
          })
          .eq('id', user.id);
      }
    }
  }
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
    .from('articles')
    .select('title, excerpt, cover_image, content, author:profiles(full_name), category:categories(name)')
    .eq('slug', decodeURIComponent(slug)).single();
    
  if (!dbArticle) return {};
  const article = dbArticle;
  const category = Array.isArray(article.category) ? article.category[0] : article.category;
  const author = Array.isArray(article.author) ? article.author[0] : article.author;
  const readTime = article.content ? `${Math.ceil(article.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200)} MIN READ` : '';
  const baseUrl = 'https://sathyadhare.com';
  const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(article.title)}&category=${encodeURIComponent(category?.name || '')}&author=${encodeURIComponent(author?.full_name || 'Sathyadhare')}&readTime=${encodeURIComponent(readTime)}${article.cover_image ? `&image=${encodeURIComponent(article.cover_image)}` : ''}`;

  return {
    title: `${article.title} | Sathyadhare`,
    description: article.excerpt || '',
    openGraph: {
      title: article.title,
      description: article.excerpt || '',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: article.title }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || '',
      images: [ogImageUrl],
    },
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
  const author = Array.isArray(article.author) ? article.author[0] : article.author;

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

  // Check if this article belongs to a sequel for chapter nav
  const { data: sequelArticleRow } = await supabase
    .from('sequel_articles')
    .select('sequel_id, order_index, sequel:sequels(id, title, slug)')
    .eq('article_id', article.id)
    .maybeSingle();

  let prevChapter = null;
  let nextChapter = null;
  let sequelInfo: { title: string; slug: string } | null = null;
  let currentChapterIndex = 1;
  let totalChapters = 1;

  if (sequelArticleRow && sequelArticleRow.sequel_id) {
    const seqData = Array.isArray(sequelArticleRow.sequel) ? sequelArticleRow.sequel[0] : sequelArticleRow.sequel;
    if (seqData) {
      sequelInfo = { title: seqData.title, slug: seqData.slug };
    }

    // Get all chapters in order
    const { data: allChapters } = await supabase
      .from('sequel_articles')
      .select('order_index, article:articles(id, title, slug, status, is_deleted)')
      .eq('sequel_id', sequelArticleRow.sequel_id)
      .order('order_index', { ascending: true });

    type ChapterRow = { id: string; title: string; slug: string; status: string; is_deleted: boolean };
    const published = (allChapters ?? [])
      .map(c => c.article as unknown as ChapterRow)
      .filter(a => a && a.status === 'published' && !a.is_deleted);

    totalChapters = published.length;
    const thisIdx = published.findIndex(a => a.id === article.id);
    currentChapterIndex = thisIdx + 1;

    if (thisIdx > 0) {
      const p = published[thisIdx - 1];
      prevChapter = { id: p.id, title: p.title, slug: p.slug, order_index: thisIdx - 1 };
    }
    if (thisIdx < published.length - 1) {
      const n = published[thisIdx + 1];
      nextChapter = { id: n.id, title: n.title, slug: n.slug, order_index: thisIdx + 1 };
    }
  }

  const autoReadTime = calculateReadTime(article.content || '');
  const readTimeLabel = `${autoReadTime} MIN READ`;
  const category = Array.isArray(article.category) ? article.category[0] : article.category;
  const categoryName = category?.name || 'ARTICLE';
  const date = formatDate(article.published_at || article.created_at);

  // Rendered HTML for TOC and TTS
  const renderedHtml = marked.parse(translateNum(article.content || '')) as string;

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
      <ScrollRestorer storageKey={article.id} isAuthenticated={!!user} userId={user?.id} />
      <ReadingProgress estimatedMinutes={autoReadTime} />
      <ReadingProgressTracker articleId={article.id} userId={user?.id} />

      {/* ─── Reader Controls: theme toggle, fullscreen, scroll buttons ─── */}
      {/* For privileged roles, this also renders a minimal overlay header */}
      <ArticleReaderControls 
        articleId={article.id} 
        userId={user?.id} 
        contentHtml={article.content} 
        title={article.title}
      />

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
              {author?.id ? (
                <Link 
                  href={`/authors/${author.id}`}
                  className="hover:text-[var(--color-primary)] transition-colors"
                >
                  {article.author_name || author?.full_name || 'Sathyadhare Editorial'}
                </Link>
              ) : (
                article.author_name || author?.full_name || 'Sathyadhare Editorial'
              )}
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

        {/* Share + Save row */}
        <div className="flex items-center gap-2 mb-4">
          <ShareButtons title={article.title} slug={article.slug}>
            <BookmarkButton
              articleId={article.id}
              initialSaved={initialSaved}
              isAuthenticated={!!user}
              saveAction={saveArticle}
              removeAction={removeArticle}
            />
          </ShareButtons>
        </div>

        {/* Like Button */}
        <div className="flex items-center gap-2">
          <ArticleLikeButton articleId={article.id} />
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Express your appreciation</span>
        </div>
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

      {/* Premium Reading Tools: AI Summary + Audio Row */}
      <ArticleReadingTools
        articleId={article.id}
        content={article.content || ''}
        title={article.title}
        existingSummary={article.ai_summary || null}
      />

      {/* Desktop: TOC + Content side by side; Mobile: TOC floating button */}
      <div className="relative">
        <TableOfContents contentHtml={renderedHtml} />
        <div className="w-full">
          {/* Article content — copy-protected */}
          <CopyProtected
            html={renderedHtml}
            className="prose-article mt-4 mb-12"
            articleId={article.id}
            userId={user?.id}
          />
        </div>
      </div>

      {/* Comment Section */}
      <div className="hide-in-fullscreen">
        {/* Continue Reading CTA */}
        {related && related[0] && !nextChapter && (
          <ContinueReading article={related[0] as unknown as { title: string; slug: string; cover_image?: string | null; category?: { name: string } | null }} />
        )}
        {nextChapter && (
          <ContinueReading article={nextChapter as unknown as { title: string; slug: string; cover_image?: string | null; category?: { name: string } | null }} label="Next Chapter" />
        )}

        <CommentBox 
          articleId={article.id}
          isAuthenticated={!!user} 
        />

        {/* Chapter Navigation (only if part of a sequel) */}
        {sequelInfo && (
          <ChapterNav
            prev={prevChapter}
            next={nextChapter}
            currentIndex={currentChapterIndex}
            totalChapters={totalChapters}
            sequelTitle={sequelInfo.title}
            sequelSlug={sequelInfo.slug}
          />
        )}

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
