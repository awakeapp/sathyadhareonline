import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import { ChevronLeft, BookOpen, Clock } from 'lucide-react';
import ArticleReaderControls, { CopyProtected } from '@/app/articles/[slug]/ArticleReaderControls';
import BookChapterNav from '@/components/BookChapterNav';
import PageContainer from '@/components/layout/PageContainer';


export const revalidate = 60;

function calculateReadTime(content: string) {
  const wordsPerMinute = 200;
  const noHtml = content?.replace(/<[^>]*>?/gm, '') || '';
  const words = noHtml.trim().split(/\s+/).length || 1;
  return Math.ceil(words / wordsPerMinute);
}

export default async function LibraryChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapterSlug: string }>;
}) {
  const { slug, chapterSlug } = await params;
  const supabase = await createClient();

  // Fetch book and current chapter
  const { data: book } = await supabase
    .from('books')
    .select('id, title, slug, author_name, cover_image')
    .eq('slug', slug)
    .single();

  if (!book) notFound();

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, title, slug, content, order_index, status')
    .eq('book_id', book.id)
    .eq('status', 'published')
    .order('order_index', { ascending: true });

  if (!chapters) notFound();

  const currentIndex = chapters.findIndex((c: { slug: string }) => c.slug === chapterSlug);
  if (currentIndex === -1) notFound();

  const chapter = chapters[currentIndex];
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const { data: { user } } = await supabase.auth.getUser();

  // For now, we use article_id as chapter_id for bookmarks/actions if we want to share the table, 
  // but since chapters aren't articles, we might need a separate table or just skip for now.
  // I'll pass a dummy ID or skip ArticleActionBar for now to avoid database errors.
  
  marked.use(gfmHeadingId());
  const renderedHtml = marked.parse(chapter.content || '') as string;
  const readTime = calculateReadTime(chapter.content || '');

  return (
    <PageContainer className="min-h-[100svh] pb-20">
      
      {/* Top Nav */}
      <nav className="flex items-center justify-between py-6 mb-8 border-b border-[var(--color-border)]">
        <Link 
          href={`/library/${book.slug}`}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
          <ChevronLeft size={14} strokeWidth={3} />
          Back to Book
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">
          <BookOpen size={14} />
          {book.title}
        </div>
      </nav>

      <ArticleReaderControls articleId={chapter.id} userId={user?.id} />

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
           <span className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-500">
             Chapter {currentIndex + 1}
           </span>
           <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
             <Clock size={12} /> {readTime} Min Read
           </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-[var(--color-text)] leading-tight tracking-tighter mb-6">
          {chapter.title}
        </h1>
        <p className="text-sm font-bold text-[var(--color-muted)]">
          By <span className="text-[var(--color-text)]">{book.author_name}</span>
        </p>
      </header>

      <div className="relative">
        <CopyProtected html={renderedHtml} className="prose-article prose-lg dark:prose-invert max-w-none mb-20" articleId={chapter.id} userId={user?.id} />
        
        {/* End of chapter divider */}
        <div className="flex flex-col items-center justify-center py-16 opacity-30">
           <div className="font-tiro-kannada text-2xl tracking-[0.5em] text-[var(--color-primary)] mb-2">***</div>
           <span className="text-[9px] font-black uppercase tracking-widest">Chapter ends</span>
        </div>
      </div>

      <BookChapterNav 
        prev={prevChapter} 
        next={nextChapter} 
        currentIndex={currentIndex + 1} 
        totalChapters={chapters.length}
        bookTitle={book.title}
        bookSlug={book.slug}
      />

    </PageContainer>
  );
}
