import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CategoryManagerClient, { Category } from './CategoryManagerClient';
import { Tag } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const supabase = await createClient();

  // ── Auth guard ──────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?error=unauthorized');
  }

  // ── Fetch categories ────────────────────────────────────────────────────────
  const { data: rawCats } = await supabase
    .from('categories')
    .select('id, name, slug, description, icon_name, sort_order')
    .eq('is_deleted', false)
    .order('sort_order', { ascending: true });

  // ── Article counts per category ─────────────────────────────────────────────
  // Fetch counts separately (no direct join count in Supabase JS v2)
  const { data: articleRows } = await supabase
    .from('articles')
    .select('category_id')
    .eq('is_deleted', false);

  const countMap: Record<string, number> = {};
  for (const row of articleRows ?? []) {
    if (row.category_id) {
      countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1;
    }
  }

  const categories: Category[] = (rawCats ?? []).map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? null,
    icon_name: c.icon_name ?? null,
    sort_order: c.sort_order ?? 0,
    article_count: countMap[c.id] ?? 0,
  }));

  return (
    <div className="font-sans antialiased min-h-screen pb-28 px-4 pt-6 bg-[var(--color-background)] text-[var(--color-text)]">
      <div className="max-w-4xl mx-auto">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-8 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Tag className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Categories
            </h1>
            <p className="text-sm text-[var(--color-muted)] font-medium mt-0.5">
              {categories.length} {categories.length === 1 ? 'category' : 'categories'} · Use the arrows or buttons to reorder
            </p>
          </div>
        </div>

        {/* ── Manager ─────────────────────────────────────────────────── */}
        <CategoryManagerClient categories={categories} />

      </div>
    </div>
  );
}
