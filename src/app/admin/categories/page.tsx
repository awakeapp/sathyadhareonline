import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CategoryManagerClient, { Category } from './CategoryManagerClient';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?denied=1');
  }

  const { data: rawCats } = await supabase
    .from('categories')
    .select('id, name, slug, description, display_order')
    .or('is_deleted.eq.false,is_deleted.is.null')
    .order('display_order', { ascending: true });

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
    id: (c as any).id,
    name: (c as any).name,
    slug: (c as any).slug,
    description: (c as any).description ?? null,
    icon_name: null,
    sort_order: (c as any).display_order ?? 0,
    article_count: countMap[(c as any).id] ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="pt-2">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">Content Categories</h1>
        <p className="text-[13px] text-[var(--color-muted)] mt-1">Organize published content into logical taxonomy</p>
      </div>

      <div className="w-full">
        <CategoryManagerClient categories={categories} />
      </div>
    </div>
  );
}
