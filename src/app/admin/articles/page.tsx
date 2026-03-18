import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Plus, Bell } from 'lucide-react';
import ArticlesClient from './ArticlesClient';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default async function ArticlesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  const role = currentProfile?.role ?? 'reader';
  if (!['admin', 'super_admin', 'editor'].includes(role)) {
    redirect('/');
  }

  // Fix #7: Permission Enforcement
  if (role !== 'super_admin') {
    const { data: permissions } = await supabase
      .from('user_content_permissions')
      .select('can_articles')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (!permissions || !permissions.can_articles) {
      redirect('/admin?denied=1');
    }
  }

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, slug, status, is_deleted, is_featured, created_at, published_at, author_id, category_id, profiles(full_name), categories(name)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching articles:', error);

  const { data: viewsData } = await supabase
    .from('article_views')
    .select('article_id');
  
  const viewsMap = new Map<string, number>();
  viewsData?.forEach(v => {
    viewsMap.set(v.article_id, (viewsMap.get(v.article_id) || 0) + 1);
  });

  const mergedArticles = (articles || []).map(a => ({
    ...a,
    is_deleted: a.is_deleted === true,
    is_featured: a.is_featured === true,
    status: a.status ?? 'draft',
    profiles: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
    categories: Array.isArray(a.categories) ? a.categories[0] : a.categories,
    views: viewsMap.get(a.id) || 0
  })) as unknown as import('./ArticlesClient').Article[];

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['admin', 'super_admin', 'editor'])
    .order('full_name');

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  return (
    <div className="w-full flex flex-col gap-4">
      <ArticlesClient 
        articles={mergedArticles}
        users={(users || []).map(u => ({ id: u.id, name: u.full_name || 'Unknown' }))}
        categories={categories || []}
        currentUserRole={role}
      />
    </div>
  );
}
