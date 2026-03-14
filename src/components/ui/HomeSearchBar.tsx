'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function HomeSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [showOptions, setShowOptions] = useState(false);

  // Fetch transliteration from Google Input Tools
  const transliterate = async (text: string) => {
    if (!text.trim()) {
      setOptions([]);
      setShowOptions(false);
      return;
    }
    try {
      // Use google input tools for kannada
      const res = await fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=kn-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`);
      const data = await res.json();
      if (data[0] === 'SUCCESS') {
        const matches = data[1][0][1];
        setOptions(matches);
        setShowOptions(true);
      }
    } catch (e) {
      console.error('Transliteration failed', e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    transliterate(val);
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
          placeholder="Search for articles..."
          className="w-full h-12 pl-12 pr-6 rounded-full bg-[var(--color-surface-2)]/50 border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] shadow-sm outline-none focus:bg-[var(--color-surface)] focus:border-[#685de6]/30 focus:ring-4 focus:ring-[#685de6]/5 transition-all font-medium text-sm"
        />
        <button
          onClick={() => submitSearch(query)}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[#685de6] transition-colors"
        >
          <Search size={18} strokeWidth={2} />
        </button>
      </div>
      
      {/* Transliteration dropdown */}
      {showOptions && options.length > 0 && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden py-2" style={{ zIndex: 100 }}>
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(opt);
                submitSearch(opt);
              }}
              className="w-full px-5 py-3 text-left hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold flex items-center gap-3 transition-colors"
            >
              <Search size={16} strokeWidth={2} className="text-[var(--color-muted)]" />
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
