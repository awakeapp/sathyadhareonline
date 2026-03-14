'use client';

import { BookOpen } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author_name: string | null;
  cover_image: string;
  drive_link: string;
  is_active: boolean;
}

interface Props {
  books: Book[];
}

export default function HomeBooksWidget({ books }: Props) {
  if (books.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-1">
        <BookOpen className="w-5 h-5 text-[#685de6]" />
        <h2 className="text-lg font-black tracking-tight text-[var(--color-text)]">Library</h2>
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] ml-auto bg-[var(--color-surface-2)] px-2 py-1 rounded-full">
          PDFs
        </span>
      </div>

      {/* Horizontal scrolling container */}
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4">
        {books.map((b) => (
          <a
            key={b.id}
            href={b.drive_link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col shrink-0 w-[120px] sm:w-[140px] snap-start tap-highlight"
            title={`Read ${b.title}`}
          >
            {/* Cover image (approx aspect ratio of a standard book ~2:3) */}
            <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-md group-hover:shadow-[0_8px_20px_rgba(104,93,230,0.15)] group-hover:-translate-y-1 transition-all duration-300 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.cover_image}
                alt={b.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            {/* Metadata */}
            <div className="pt-3 pb-1">
              <h3 className="text-sm font-bold text-[var(--color-text)] leading-tight line-clamp-2 mb-0.5 group-hover:text-[#685de6] transition-colors">
                {b.title}
              </h3>
              {b.author_name && (
                <p className="text-[11px] text-[var(--color-muted)] font-medium line-clamp-1">
                  {b.author_name}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
