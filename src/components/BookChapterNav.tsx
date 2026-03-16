import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  slug: string;
  order_index: number;
}

interface BookChapterNavProps {
  prev: Chapter | null;
  next: Chapter | null;
  currentIndex: number;
  totalChapters: number;
  bookTitle: string;
  bookSlug: string;
}

export default function BookChapterNav({
  prev,
  next,
  currentIndex,
  totalChapters,
  bookTitle,
  bookSlug,
}: BookChapterNavProps) {
  return (
    <nav className="mt-20 pt-10 border-t border-[var(--color-border)]">
      
      {/* Progress info */}
      <div className="mb-8">
        <div className="flex justify-between text-[10px] font-black text-zinc-400 mb-2 uppercase tracking-[0.2em]">
          <span>Reading: {bookTitle}</span>
          <span>{Math.round((currentIndex / totalChapters) * 100)}% complete</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-700 ease-out"
            style={{ width: `${(currentIndex / totalChapters) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {prev ? (
          <Link
            href={`/library/${bookSlug}/${prev.slug}`}
            className="group flex flex-col items-start gap-2 p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-transparent hover:border-indigo-500/30 transition-all"
          >
            <div className="flex items-center gap-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
              <ChevronLeft size={12} strokeWidth={3} />
              Previous
            </div>
            <p className="text-sm font-black text-[var(--color-text)] line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
              {prev.title}
            </p>
          </Link>
        ) : (
          <div />
        )}

        {next ? (
          <Link
            href={`/library/${bookSlug}/${next.slug}`}
            className="group flex flex-col items-end text-right gap-2 p-6 rounded-3xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border border-transparent transition-all shadow-xl shadow-indigo-500/10 hover:scale-[1.02] active:scale-95"
          >
            <div className="flex items-center gap-2 text-[9px] font-black opacity-60 uppercase tracking-widest">
              Next Chapter
              <ChevronRight size={12} strokeWidth={3} />
            </div>
            <p className="text-sm font-black line-clamp-1 uppercase tracking-tight">
              {next.title}
            </p>
          </Link>
        ) : (
          <Link
            href={`/library/${bookSlug}`}
            className="group flex flex-col items-center justify-center text-center gap-1 p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 transition-all"
          >
            <p className="text-[10px] font-black uppercase tracking-widest">Finished Review!</p>
            <p className="text-xs font-bold opacity-60">Back to Index</p>
          </Link>
        )}
      </div>
    </nav>
  );
}
