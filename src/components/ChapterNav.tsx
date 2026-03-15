import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  slug: string;
  order_index: number;
}

interface ChapterNavProps {
  prev: Chapter | null;
  next: Chapter | null;
  currentIndex: number;
  totalChapters: number;
  sequelTitle: string;
  sequelSlug: string;
}

export default function ChapterNav({
  prev,
  next,
  currentIndex,
  totalChapters,
  sequelTitle,
  sequelSlug,
}: ChapterNavProps) {
  return (
    <nav className="mt-12 pt-8 border-t border-[var(--color-border)]">
      {/* Series label */}
      <div className="flex items-center gap-2 mb-4">
        <Link
          href={`/sequels/${sequelSlug}`}
          className="text-xs font-black uppercase tracking-widest text-[var(--color-primary)] hover:opacity-70 transition-opacity"
        >
          ← Back to Series
        </Link>
        <span className="text-[var(--color-border)]">·</span>
        <span className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">
          {sequelTitle}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-[10px] font-bold text-[var(--color-muted)] mb-1.5 uppercase tracking-widest">
          <span>Chapter {currentIndex} of {totalChapters}</span>
          <span>{Math.round((currentIndex / totalChapters) * 100)}% complete</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
            style={{ width: `${(currentIndex / totalChapters) * 100}%` }}
          />
        </div>
      </div>

      {/* Prev / Next Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {prev ? (
          <Link
            href={`/articles/${prev.slug}`}
            className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-2)] transition-all group"
          >
            <div className="mt-0.5 w-7 h-7 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center shrink-0 group-hover:bg-[var(--color-primary)]/10 transition-colors">
              <ChevronLeft size={14} className="text-[var(--color-muted)] group-hover:text-[var(--color-primary)]" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-1">Previous</p>
              <p className="text-sm font-bold text-[var(--color-text)] line-clamp-2 leading-snug group-hover:text-[var(--color-primary)] transition-colors">
                {prev.title}
              </p>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {next ? (
          <Link
            href={`/articles/${next.slug}`}
            className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-2)] transition-all group col-start-2"
          >
            <div className="min-w-0 text-right flex-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-1">Next</p>
              <p className="text-sm font-bold text-[var(--color-text)] line-clamp-2 leading-snug group-hover:text-[var(--color-primary)] transition-colors">
                {next.title}
              </p>
            </div>
            <div className="mt-0.5 w-7 h-7 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center shrink-0 group-hover:bg-[var(--color-primary)]/10 transition-colors">
              <ChevronRight size={14} className="text-[var(--color-muted)] group-hover:text-[var(--color-primary)]" strokeWidth={2.5} />
            </div>
          </Link>
        ) : (
          <div className="flex items-center justify-center p-4 rounded-2xl bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] col-start-2">
            <p className="text-xs font-bold text-[var(--color-muted)] text-center">🎉 Series complete!</p>
          </div>
        )}
      </div>
    </nav>
  );
}
