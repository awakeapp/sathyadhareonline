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

export const revalidate = 60;

const MOCKS: Record<string, any> = {
  'mock-hero': { title: 'ವಿದ್ಯುತ್ ವಾಹನಗಳ ಭವಿಷ್ಯ ಮತ್ತು ಸವಾಲುಗಳು', cover_image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&q=80', category: { name: 'TECHNOLOGY' } },
  'l1': { title: 'ಭಾರತೀಯ ಬಾಹ್ಯಾಕಾಶ ಸಂಶೋಧನಾ ಸಂಸ್ಥೆಯ (ISRO) ಐತಿಹಾಸಿಕ ನೆಗೆತ', cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80', category: { name: 'SCIENCE' } },
  'l2': { title: 'ದೈನಂದಿನ ಜೀವನದಲ್ಲಿ ಯೋಗ: ಮಾನಸಿಕ ಮತ್ತು ದೈಹಿಕ ಶಾಂತಿಗಾಗಿ', cover_image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80', category: { name: 'LIFE' } },
  'l3': { title: 'ಆರ್ಟಿಫಿಶಿಯಲ್ ಇಂಟೆಲಿಜೆನ್ಸ್ ಭವಿಷ್ಯವನ್ನು ಹೇಗೆ ಬದಲಾಯಿಸುತ್ತಿದೆ?', cover_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80', category: { name: 'TECH' } },
  'l4': { title: 'ಕರ್ನಾಟಕದ ಪ್ರಾಚೀನ ದೇವಾಲಯಗಳ ವಾಸ್ತುಶಿಲ್ಪದ ಪರಂಪರೆ', cover_image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=1200&q=80', category: { name: 'HISTORY' } },
  't1': { title: 'ಮಳೆಗಾಲದಲ್ಲಿ ಸಹಜ ಪ್ರಕೃತಿಯ ಸೌಂದರ್ಯದ ದರ್ಶನ', cover_image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&q=80', category: { name: 'NATURE' } },
  't2': { title: 'ಮಕ್ಕಳಲ್ಲಿ ಕಥೆ ಓದುವ ಹವ್ಯಾಸವನ್ನು ಹೇಗೆ ಬೆಳೆಸುವುದು?', cover_image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80', category: { name: 'LITERATURE' } },
  't3': { title: 'ಡಿಜಿಟಲ್ ಜಗತ್ತಿನಲ್ಲಿ ಡೇಟಾ ಸುರಕ್ಷತೆಯ ಸವಾಲುಗಳು', cover_image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80', category: { name: 'TECH' } },
};

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
    .from('articles').select('title, excerpt, cover_image').eq('slug', slug).single();
    
  let article: any = dbArticle;
  if (!article) {
    if (MOCKS[slug]) {
      article = { title: MOCKS[slug].title, excerpt: 'Mock article preview.', cover_image: MOCKS[slug].cover_image };
    } else {
      return {};
    }
  }
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
    .eq('slug', slug).single();
    
  let article: any = dbArticle;
  
  if (error || !article) {
    if (MOCKS[slug]) {
      article = {
        id: slug,
        title: MOCKS[slug].title,
        slug: slug,
        content: `
          <p><strong>ಸೂಚನೆ:</strong> ಇದು ಕೇವಲ ಉದಾಹರಣೆಗಾಗಿ ರಚಿಸಲಾದ ಕೃತಕ (Mock) ಲೇಖನ. ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಇದುವರೆಗೆ ನೈಜ ಲೇಖನವಿಲ್ಲ, ಆದ್ದರಿಂದ ಈ ಡಮ್ಮಿ ಡೇಟಾವನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.</p>
          <br/>
          <p>ಇದು ಹೋಮ್‌ಪೇಜ್ ವಿನ್ಯಾಸಕ್ಕಾಗಿ ಒದಗಿಸಲಾದ ಕೃತಕ (Mock) ಲೇಖನ. ನಿಜವಾದ ಡೇಟಾವನ್ನು ಡೇಟಾಬೇಸ್‌ಗೆ ಸೇರಿಸಿದಾಗ ಈ ಲೇಖನ ಇರುವುದಿಲ್ಲ.</p>
          <p>This is a mock placeholder article to demonstrate the reading view. You clicked on a demo card from the homepage.</p>
          <br/>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam nec efficitur enim. Nullam ultricies tincidunt risus. Fusce scelerisque tellus et libero hendrerit congue. Aenean quis tristique nibh. Nunc nec nisl non velit viverra luctus. Integer vehicula tempor magna convallis egestas. Nulla volutpat pretium purus a ornare.</p>
        `,
        cover_image: MOCKS[slug].cover_image,
        published_at: new Date().toISOString(),
        read_time: 3,
        category: MOCKS[slug].category,
        author: { full_name: 'Sathyadhare Editor' },
        category_id: 'mock-category',
      } as any;
    } else {
      notFound();
    }
  }

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

          <BookmarkButton
            articleId={article.id}
            initialSaved={initialSaved}
            isAuthenticated={!!user}
            saveAction={saveArticle}
            removeAction={removeArticle}
          />
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
      <CommentBox userInitial={user?.email?.charAt(0).toUpperCase() || '?'} isAuthenticated={!!user} />

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
