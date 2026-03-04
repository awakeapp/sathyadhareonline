'use client';

import React, { useRef } from 'react';

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  defaultValue = '',
  placeholder = 'Search articles, topics, series…',
  autoFocus = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form method="GET" action="/search" className="w-full max-w-2xl mx-auto" role="search">
      <div className="relative">
        {/* Icon */}
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          <svg
            className="w-5 h-5"
            style={{ color: '#8a91b8' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
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
          className="search-input w-full pl-12 pr-28 py-4 rounded-xl text-sm outline-none"
          style={{
            background: '#111228',
            border: '1.5px solid #252645',
            color: '#e8eaf6',
            fontSize: '0.9375rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = '#ffd500';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,213,0,0.1)';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = '#252645';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
          }}
        />

        <button
          type="submit"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all active:scale-95 tap-highlight"
          style={{ background: '#ffd500', color: '#0a0b1a' }}
        >
          Search
        </button>
      </div>
    </form>
  );
}
