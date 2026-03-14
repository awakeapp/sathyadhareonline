'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  href?: string;
}

export default function SectionHeader({ title, href }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 mt-8 px-1">
      <h2 className="text-sm font-black text-[var(--color-text)] uppercase tracking-widest">
        {title}
      </h2>
      {href && (
        <Link 
          href={href}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all active:scale-95 group"
        >
          <span className="text-[10px] font-black uppercase tracking-widest">See All</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={3} />
        </Link>
      )}
    </div>
  );
}
