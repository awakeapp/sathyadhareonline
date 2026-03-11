import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CategoryManagerClient, { Category } from './CategoryManagerClient';
import { Tag, ChevronLeft, Bell } from 'lucide-react';
import Link from 'next/link';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role').eq('id', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?error=unauthorized');
  }

  const { data: rawCats } = await supabase
    .from('categories')
    .select('id, name, slug, description, icon_name, sort_order')
    .or('is_deleted.eq.false,is_deleted.is.null')
    .order('sort_order', { ascending: true });

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

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Presence"
        roleLabel="Category Architecture"
        initials={initials}
        icon1={Bell}
        icon2={ChevronLeft}
        icon2Href="/admin"
      />
      
      <div className="px-5 -mt-8 pb-10 space-y-6 relative z-20">
        <CategoryManagerClient categories={categories} />
      </div>
    </PresenceWrapper>
  );
}
