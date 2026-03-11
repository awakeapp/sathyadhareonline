import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Plus } from 'lucide-react';
import ArticlesClient from './ArticlesClient';

export const dynamic = 'force-dynamic';

export default async function ArticlesPage() {
  const supabase = await createClient();

  // 1. Auth & Guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = currentProfile?.role ?? 'reader';
  if (!['admin', 'super_admin', 'editor'].includes(role)) {
    redirect('/');
  }

  // 2. Fetch Data
  
  // A. Articles
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, slug, status, is_deleted, is_featured, created_at, published_at, author_id, category_id, profiles(full_name), categories(name)')
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching articles:', error);

  // B. Views (Aggregated)
  const { data: viewsData } = await supabase
    .from('article_views')
    .select('article_id');
  
  // Count views locally since Supabase JS doesn't easily aggregate dynamically
  const viewsMap = new Map<string, number>();
  viewsData?.forEach(v => {
    viewsMap.set(v.article_id, (viewsMap.get(v.article_id) || 0) + 1);
  });

  const mergedArticles = (articles || []).map(a => ({
    ...a,
    profiles: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
    categories: Array.isArray(a.categories) ? a.categories[0] : a.categories,
    views: viewsMap.get(a.id) || 0
  })) as unknown as import('./ArticlesClient').Article[];

  // C. Users (Authors for filter)
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['admin', 'super_admin', 'editor'])
    .order('full_name');

  // D. Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  return (
    <div className="font-sans antialiased max-w-5xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 mt-4 px-2">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)] hover:text-white shrink-0 shadow-sm transition-colors">
            <Link href="/admin">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Article Library
            </h1>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-1">
              {mergedArticles.length} Total Documents · {role.replace('_', ' ')}
            </p>
          </div>
        </div>
        <Button asChild className="rounded-2xl h-11 px-6 font-black bg-[var(--color-primary)] text-black hover:bg-[#ffed4a] hover:scale-[1.02] shadow-lg shadow-[var(--color-primary)]/20 transition-all shrink-0">
          <Link href="/admin/articles/new">
            <Plus className="w-5 h-5 mr-1.5" />
            <span>Create New Article</span>
          </Link>
        </Button>
      </div>

      <ArticlesClient 
        articles={mergedArticles}
        users={(users || []).map(u => ({ id: u.id, name: u.full_name || 'Unknown' }))}
        categories={categories || []}
        currentUserRole={role}
      />
    </div>
  );
}
