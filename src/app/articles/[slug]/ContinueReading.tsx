'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen } from 'lucide-react';

interface Props {
  article: {
    title: string;
    slug: string;
    cover_image?: string | null;
    category?: { name: string } | null;
  };
  label?: string;
}

export default function ContinueReading({ article, label = "Continue Reading" }: Props) {
  return (
    <Link 
      href={`/articles/${article.slug}`}
      className="group block relative w-full overflow-hidden rounded-[2.5rem] bg-[var(--color-surface-2)] border border-[var(--color-border)] transition-all hover:scale-[1.01] hover:shadow-xl active:scale-[0.99] mb-8"
    >
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
        {/* Cover Image */}
        {article.cover_image && (
          <div className="w-full sm:w-40 aspect-video sm:aspect-square rounded-2xl overflow-hidden shrink-0 shadow-sm">
            <Image
              src={article.cover_image}
              alt={article.title}
              width={400}
              height={400}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </div>
        )}

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest rounded-full">
              <BookOpen className="w-3 h-3" />
              {label}
            </span>
          </div>
          
          <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text)] leading-tight mb-4 line-clamp-2">
            {article.title}
          </h3>

          <div className="flex items-center justify-center sm:justify-start gap-2 text-[var(--color-primary)] font-bold text-sm">
            <span>Read Next</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-16 -mt-[var(--header-height)] w-48 h-48 bg-[var(--color-primary)]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
