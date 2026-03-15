'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, Calendar, Tag, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  categories: Category[];
}

export default function SearchFilters({ categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentCategory = searchParams.get('c');
  const currentDateRange = searchParams.get('d');
  const query = searchParams.get('q');

  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    router.push(`/search?${params.toString()}`);
  };

  const activeFiltersCount = (currentCategory ? 1 : 0) + (currentDateRange ? 1 : 0);

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
          <Filter size={16} />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-[var(--color-primary)] text-black text-[10px] px-1.5 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button 
            onClick={clearFilters}
            className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1 hover:opacity-70 transition-opacity"
          >
            <X size={12} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Category Filter */}
        <div className="flex-1 min-w-[140px]">
          <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">
            <Tag size={12} />
            <span>Category</span>
          </div>
          <select 
            value={currentCategory || ''}
            onChange={(e) => updateFilters({ c: e.target.value || null })}
            className="w-full h-11 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-bold focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex-1 min-w-[140px]">
          <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">
            <Calendar size={12} />
            <span>Time Range</span>
          </div>
          <select 
            value={currentDateRange || ''}
            onChange={(e) => updateFilters({ d: e.target.value || null })}
            className="w-full h-11 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-bold focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">Any Time</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="year">Past Year</option>
          </select>
        </div>
      </div>
    </div>
  );
}
