'use client';

import { BookOpen } from 'lucide-react';
import Link from 'next/link';

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
        <Link href="/books" className="text-lg font-black tracking-tight text-[var(--color-text)] hover:text-[#685de6] transition-colors">Library</Link>
        <Link href="/books" className="text-[10px] font-black uppercase tracking-widest text-[#685de6] ml-auto bg-[#685de6]/10 px-3 py-1.5 rounded-full hover:bg-[#685de6]/20 transition-colors">
          View All
        </Link>
      </div>

      {/* Horizontal scrolling container */}
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4">
        {books.map((b) => (
          <Link
            key={b.id}
            href={`/books/${b.id}`}
            className="group flex flex-col shrink-0 w-[120px] sm:w-[140px] snap-start tap-highlight"
            title={`Read ${b.title}`}
          >
            {/* Cover image (approx 3:4 aspect ratio) */}
            <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-md group-hover:shadow-[0_8px_20px_rgba(104,93,230,0.15)] group-hover:-translate-y-1 transition-all duration-300 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.cover_image}
                alt={b.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
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
          </Link>
        ))}
      </div>
    </div>
  );
}
