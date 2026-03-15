import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Share2, Bookmark, BookOpen, ChevronLeft, ArrowRight, Play } from 'lucide-react';

export const revalidate = 60;

export default async function BookIndexPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  
  // Handle case where id is sent as slug
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .or(`id.eq.${params.slug}`)
    .maybeSingle();

  if (!book) {
    return notFound();
  }

  let isLegacyLink = false;
  let parsedChapterIds: string[] = [];

  try {
    const parsed = JSON.parse(book.drive_link);
    if (Array.isArray(parsed)) {
       parsedChapterIds = parsed;
    } else {
       isLegacyLink = true;
    }
  } catch {
    isLegacyLink = true;
  }

  let fetchedChapters: { id: string, title: string, slug: string, excerpt: string }[] = [];
  if (!isLegacyLink && parsedChapterIds.length > 0) {
     const { data: articles } = await supabase
       .from('articles')
       .select('id, title, slug, excerpt')
       .in('id', parsedChapterIds);
     
     if (articles) {
       fetchedChapters = parsedChapterIds.map(id => articles.find(a => a.id === id)).filter(Boolean) as { id: string, title: string, slug: string, excerpt: string }[];
     }
  }

  const hasChapters = fetchedChapters.length > 0;
  const firstChapterLink = isLegacyLink ? book.drive_link : (hasChapters ? `/articles/${fetchedChapters[0].slug}` : '#');

  return (
    <div className="min-h-[100svh] bg-[var(--color-bg)] px-4 py-8 pb-32 max-w-lg mx-auto sm:max-w-3xl lg:max-w-5xl font-sans">
      
      {/* Top Navigation */}
      <nav className="flex items-center justify-between mb-8 z-20 relative">
        <Link 
          href="/books" 
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text)] hover:text-[#685de6] active:scale-90 transition-all shadow-sm"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </Link>
        
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text)] hover:text-[#685de6] active:scale-90 transition-all shadow-sm">
            <Share2 size={16} strokeWidth={2.5} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-text)] hover:text-[#685de6] active:scale-90 transition-all shadow-sm">
            <Bookmark size={16} strokeWidth={2.5} />
          </button>
        </div>
      </nav>

      {/* Book Info Section (Hero) */}
      <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 mb-12 sm:mb-16">
        
        {/* Cover side */}
        <div className="w-56 sm:w-64 shrink-0 mx-auto sm:mx-0 relative group">
          <div className="w-full aspect-[3/4] rounded-[2rem] overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative z-10">
            {book.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.cover_image}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-muted)]">
                <BookOpen size={40} className="mb-4 opacity-50" />
                <span className="font-bold uppercase tracking-widest text-xs">No Cover</span>
              </div>
            )}
            {/* Book spine lighting */}
            <div className="absolute inset-y-0 left-0 w-3 sm:w-4 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-transparent pointer-events-none mix-blend-multiply" />
          </div>
          {/* Back drop shadow behind book */}
          <div className="absolute top-10 inset-x-4 -bottom-4 bg-black/20 blur-2xl z-0 rounded-full dark:bg-black/50" />
        </div>

        {/* Info side */}
        <div className="flex flex-col justify-center flex-1 text-center sm:text-left mt-2 sm:mt-0 z-10">
          <div className="inline-block px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest self-center sm:self-start mb-4 shadow-sm backdrop-blur-sm border border-[var(--color-primary)]/20">
            {isLegacyLink ? 'PDF Book' : 'Article Book'}
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--color-text)] leading-tight tracking-tight mb-3">
            {book.title}
          </h1>
          
          <p className="text-sm sm:text-base font-bold text-[var(--color-muted)] mb-8 flex items-center justify-center sm:justify-start gap-2">
            By <span className="text-[var(--color-text)] px-3 py-1 bg-[var(--color-surface-2)] rounded-lg">{book.author_name || 'Unknown Author'}</span>
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-4">
            <Link 
              href={firstChapterLink}
              target={isLegacyLink ? "_blank" : "_self"}
              className={`flex items-center justify-center gap-3 h-14 px-8 rounded-2xl text-white font-black uppercase tracking-widest text-sm shadow-[0_10px_30px_rgba(104,93,230,0.3)] hover:scale-105 active:scale-95 transition-all ${!hasChapters && !isLegacyLink ? 'bg-gray-500 opacity-50 pointer-events-none' : 'bg-[#685de6]'}`}
            >
              <Play size={16} fill="white" />
              {isLegacyLink ? 'Read PDF' : 'Start Reading'}
            </Link>
          </div>
        </div>
      </div>

      {/* Chapters / Index Section */}
      <div className="mt-12 sm:mt-16 bg-[var(--color-surface)] sm:border border-[var(--color-border)] rounded-[2.5rem] p-6 sm:p-10 shadow-sm relative overflow-hidden">
        {/* Decorative BG element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex items-center justify-between mb-8 sm:mb-10 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-[var(--color-surface-2)] rounded-2xl text-[var(--color-primary)] shadow-sm">
              <BookOpen size={24} strokeWidth={2.5} />
            </div>
            Index
          </h2>
          <span className="text-sm font-bold text-[var(--color-muted)] bg-[var(--color-surface-2)] px-4 py-1.5 rounded-full">
            {isLegacyLink ? '1 File' : `${fetchedChapters.length} Chapters`}
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 relative z-10">
          {isLegacyLink ? (
             <a 
               href={book.drive_link}
               target="_blank"
               rel="noopener noreferrer" 
               className="group block"
             >
               <Card hoverable className="p-4 sm:p-5 flex items-center gap-5 rounded-3xl bg-[var(--color-surface-2)] sm:bg-[var(--color-surface)] border sm:border-[var(--color-border)] group-hover:bg-[var(--color-surface-2)] transition-all shadow-sm sm:shadow-none hover:shadow-md cursor-pointer relative overflow-hidden">
                 <div className="absolute left-0 top-0 bottom-0 w-2 bg-[var(--color-primary)] scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                 <div className="w-12 h-12 shrink-0 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] font-black text-lg group-hover:bg-white dark:group-hover:bg-[#1a222c] shadow-sm transition-colors">
                   1
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="text-[15px] sm:text-[17px] font-black text-[var(--color-text)] whitespace-nowrap overflow-hidden text-ellipsis mb-1 group-hover:text-[var(--color-primary)] transition-colors">
                     Full PDF Document
                   </h4>
                   <p className="text-[11px] sm:text-xs font-semibold text-[var(--color-muted)] uppercase tracking-widest flex items-center gap-1.5">
                     External Link
                   </p>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text)] opacity-60 group-hover:opacity-100 group-hover:-translate-x-1 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all shadow-sm">
                   <ArrowRight size={16} strokeWidth={3} />
                 </div>
               </Card>
             </a>
          ) : fetchedChapters.length > 0 ? (
             fetchedChapters.map((chapter, idx) => (
               <Link 
                 key={chapter.id}
                 href={`/articles/${chapter.slug}`}
                 className="group block"
               >
                 <Card hoverable className="p-4 sm:p-5 flex items-center gap-5 rounded-3xl bg-[var(--color-surface-2)] sm:bg-[var(--color-surface)] border sm:border-[var(--color-border)] group-hover:bg-[var(--color-surface-2)] transition-all shadow-sm sm:shadow-none hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] cursor-pointer relative overflow-hidden">
                   {/* Left highlight bar */}
                   <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--color-primary)] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center rounded-r-full" />
                   
                   {/* Chapter Number Badge */}
                   <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-[1.25rem] bg-[var(--color-surface-2)] sm:bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col items-center justify-center text-[var(--color-text)] font-black group-hover:bg-white dark:group-hover:bg-[#1a222c] shadow-sm transition-colors">
                     <span className="text-[9px] uppercase tracking-widest text-[var(--color-muted)] mb-0.5 leading-none">Ch</span>
                     <span className="text-lg leading-none">{idx + 1}</span>
                   </div>
                   
                   {/* Chapter Info */}
                   <div className="flex-1 min-w-0 py-1">
                     <h4 className="text-[15px] sm:text-[17px] font-black text-[var(--color-text)] whitespace-nowrap overflow-hidden text-ellipsis mb-1.5 group-hover:text-[var(--color-primary)] transition-colors">
                       {chapter.title}
                     </h4>
                     <p className="text-[11px] sm:text-[13px] font-medium text-[var(--color-muted)] line-clamp-1 leading-relaxed">
                       {chapter.excerpt || 'Read this chapter to discover more...'}
                     </p>
                   </div>

                   {/* Arrow Icon */}
                   <div className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] sm:bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] opacity-80 group-hover:opacity-100 group-hover:-translate-x-1 group-hover:bg-[var(--color-primary)] group-hover:border-transparent group-hover:text-white transition-all shadow-sm shrink-0">
                     <ArrowRight size={16} strokeWidth={2.5} />
                   </div>
                 </Card>
               </Link>
             ))
          ) : (
             <div className="p-8 sm:p-12 text-center bg-[var(--color-surface-2)] rounded-3xl border border-[var(--color-border)] border-dashed">
                <BookOpen className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-black text-[var(--color-text)] mb-2">Coming Soon</h3>
                <p className="text-sm text-[var(--color-muted)] font-medium max-w-sm mx-auto">Chapters are currently being written and will be published here soon.</p>
             </div>
          )}
        </div>
      </div>

    </div>
  );
}
