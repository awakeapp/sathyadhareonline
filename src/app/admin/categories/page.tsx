import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('name, slug').order('created_at', { ascending: false })

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white safe-area-pb">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-white transition-colors active:scale-95">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">Categories</h1>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
                {categories?.length || 0} Total Categories
              </p>
            </div>
          </div>
          <Link
            href="/admin/categories/new"
            className="flex items-center gap-1.5 bg-[var(--color-primary)] text-black px-4 py-2.5 rounded-full text-sm font-bold hover:bg-[#ffed4a] transition-all shadow-lg shadow-[var(--color-primary)]/20 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">New</span>
          </Link>
        </div>

        {!categories || categories.length === 0 ? (
          <div className="py-20 text-center text-[var(--color-muted)] flex flex-col items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 shadow-lg">
            <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            <p className="font-semibold text-white mb-1">No categories found</p>
            <p className="text-sm">Create your first category to organize content.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat, idx) => (
              <div
                key={cat.slug}
                className="flex items-center gap-4 p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl shadow-lg relative overflow-hidden group hover:border-[var(--color-primary)]/30 transition-colors"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg shadow-inner ${
                  ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500', 'bg-amber-500'][idx % 5]
                }`}>
                  <svg className="w-5 h-5 absolute opacity-30" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                  <span className="relative z-10">{cat.name.charAt(0).toUpperCase()}</span>
                </div>
                
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-bold text-white text-[16px] truncate mb-1">
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[12px] text-[var(--color-muted)] font-mono bg-black/30 w-full rounded-md px-2 py-1">
                    <span className="text-[var(--color-muted)]/50 select-none">/</span>
                    <span className="truncate">{cat.slug}</span>
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[var(--color-muted)] text-[10px] uppercase font-bold tracking-widest whitespace-nowrap">
                    ACTIVE
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
