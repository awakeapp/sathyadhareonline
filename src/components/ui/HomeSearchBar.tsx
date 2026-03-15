'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Book, FileText, Layers, Loader2 } from 'lucide-react';
import { fetchHomeSuggestions, HomeSearchResult } from '@/app/actions/homeSearch';

export default function HomeSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<HomeSearchResult[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSearchAutocomplete = async (text: string) => {
    if (!text.trim()) {
      setOptions([]);
      setShowOptions(false);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      let searchTerms = [text];
      try {
        const res = await fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=kn-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`);
        const data = await res.json();
        if (data[0] === 'SUCCESS') {
          const matches = data[1][0][1]; // Array of transliterated string options
          searchTerms = Array.from(new Set([text, ...matches])); // e.g. ["ra", "ರ", "ರಾ", ...]
        }
      } catch (e) {
        console.error('Transliteration failed', e);
      }

      const results = await fetchHomeSuggestions(searchTerms);
      setOptions(results);
      setShowOptions(true);
    } catch (e) {
      console.error('Search autocomplete failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      handleSearchAutocomplete(val);
    }, 300);
  };

  const submitSearch = (searchVal: string) => {
    if (!searchVal.trim()) return;
    setShowOptions(false);
    router.push(`/search?q=${encodeURIComponent(searchVal)}`);
  };

  return (
    <div className="relative mb-6 z-30 px-2 lg:px-0 mt-4 max-w-lg mx-auto w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitSearch(query);
          }}
          onFocus={() => { if (options.length > 0) setShowOptions(true); }}
          placeholder="Search"
          className="w-full h-12 pl-12 pr-6 rounded-full bg-[var(--color-surface-2)]/50 border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] shadow-sm outline-none focus:bg-[var(--color-surface)] focus:border-[#685de6]/60 transition-all font-medium text-sm"
        />
        <button
          onClick={() => {
            import('@/lib/haptics').then(({ haptics }) => haptics.impact('light'));
            submitSearch(query);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[#685de6] active:scale-90 transition-transform"
        >
          {isLoading ? (
            <Loader2 size={18} strokeWidth={2} className="animate-spin text-[#685de6]" />
          ) : (
            <Search size={18} strokeWidth={2} />
          )}
        </button>
      </div>
      
      {/* Transliteration dropdown */}
      {showOptions && options.length > 0 && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden py-2" style={{ zIndex: 100 }}>
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => {
                import('@/lib/haptics').then(({ haptics }) => haptics.impact('light'));
                setShowOptions(false);
                router.push(opt.href);
              }}
              className="w-full px-5 py-3 text-left bg-[var(--color-surface)] active:bg-[var(--color-surface-2)] active:scale-[0.99] flex items-center gap-3 transition-transform border-b last:border-0 border-[var(--color-border)]/50"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)]">
                {opt.type === 'book' && <Book size={14} strokeWidth={2} />}
                {opt.type === 'article' && <FileText size={14} strokeWidth={2} />}
                {opt.type === 'sequel' && <Layers size={14} strokeWidth={2} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--color-text)] font-semibold text-sm truncate">{opt.title}</p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-muted)] mt-0.5">
                  {opt.type === 'book' ? 'Library' : opt.type}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
