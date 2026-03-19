import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import { ChevronRight, Layers } from 'lucide-react';

export const revalidate = 3600; // Cache for 1 hour

export default async function CategoriesPage() {
  const supabase = await createClient();

  // Fetch categories along with their published article counts
  // We fetch counts by joining with articles table
  const { data: categoriesData, error } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      slug,
      icon_name,
      articles (
        id
      )
    `)
    .eq('articles.status', 'published')
    .eq('articles.is_deleted', false);

  if (error) {
    console.error('Error fetching categories:', error);
  }

  // Sort by count descending then by name
  const categories = (categoriesData || []).map(cat => ({
    ...cat,
    count: Array.isArray(cat.articles) ? cat.articles.length : 0
  })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return (
    <div className="min-h-[100svh] px-4 pt-6 pb-20 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl">
      
      <header className="mb-10">
        <SectionHeader title="Explore Categories" />
        <p className="text-sm font-semibold text-[var(--color-muted)] mt-2">
          Discover articles across a wide range of topics and interests.
        </p>
      </header>

      {categories.length === 0 ? (
        <Card className="text-center py-24 rounded-[2rem] shadow-none border-dashed bg-[var(--color-surface)] border-[var(--color-border)]">
          <p className="text-sm font-bold tracking-widest uppercase text-[var(--color-muted)]">No categories found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`} className="group active:scale-[0.98] transition-all">
              <Card className="p-6 rounded-[2rem] border-none bg-[var(--color-surface-2)] group-hover:bg-[var(--color-primary)] transition-all duration-300 relative overflow-hidden h-full">
                
                {/* Decorative Background Icon */}
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                   <Layers className="w-32 h-32" />
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-black text-[var(--color-text)] group-hover:text-white transition-colors tracking-tight">
                      {category.name}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-muted)] group-hover:text-white/60 transition-colors">
                      {category.count} {category.count === 1 ? 'Article' : 'Articles'}
                    </p>
                  </div>
                  
                  <div className="w-10 h-10 rounded-full bg-[var(--color-background)] group-hover:bg-white/20 flex items-center justify-center text-[var(--color-text)] group-hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" strokeWidth={3} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Links / Footer Note */}
      <div className="mt-16 pt-8 border-t border-[var(--color-border)] flex flex-col items-center text-center">
         <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)] mb-6">Can&apos;t find what you&apos;re looking for?</p>
         <Link href="/search" className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text)] font-bold text-sm hover:bg-[var(--color-surface)] transition-all active:scale-95">
            Try Global Search
         </Link>
      </div>

    </div>
  );
}
