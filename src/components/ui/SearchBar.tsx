'use client';

import React, { useRef } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  defaultValue = '',
  placeholder = 'Search articles, topics, sequels…',
  autoFocus = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form method="GET" action="/search" className="w-full mx-auto" role="search">
      <div className="relative group flex items-center">
        {/* Icon */}
        <div className="pointer-events-none absolute left-4 text-[var(--color-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
          <Search className="w-5 h-5" aria-hidden="true" />
        </div>

        <input
          ref={inputRef}
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          aria-label={placeholder}
          className="search-input w-full pl-12 pr-28 py-4 rounded-2xl text-sm outline-none bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-text)] shadow-sm focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-medium placeholder:text-[var(--color-muted)]"
        />

        <Button
          type="submit"
          variant="primary"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl text-xs shadow-lg shadow-[#685de6]/20 text-white h-10 font-black uppercase tracking-widest bg-[#685de6] border-none hover:scale-105 active:scale-95 transition-all"
        >
          Search
        </Button>
      </div>
    </form>
  );
}
