import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ArticlesClient from './ArticlesClient';

export const dynamic = 'force-dynamic';

export default async function ArticlesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    redirect('/admin/manage');
  }

  const role = profile.role;
  const isSuperAdmin = role === 'super_admin';
  const isAdminOrSuper = isSuperAdmin || role === 'admin';
  const isEditor = role === 'editor';

  if (!isAdminOrSuper && !isEditor) {
    redirect('/admin/manage');
  }

  let query = supabase
    .from('articles')
    .select(`
      id,
      title,
      status,
      author_name,
      author_type,
      assigned_to,
      assigned_at,
      assignment_notes,
      created_at,
      updated_at,
      image,
      assigned:profiles!assigned_to(full_name),
      category:categories(name)
    `)
    .order('updated_at', { ascending: false })
    .limit(60);

  if (isEditor && !isAdminOrSuper) {
    query = query.eq('assigned_to', user.id);
  }

  const [articlesResult, staffResult] = await Promise.all([
    query,
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['editor', 'admin', 'super_admin'])
      .order('full_name', { ascending: true })
  ]);

  const rawArticles = articlesResult.data || [];
  
  const articles = rawArticles.map((a: any) => ({
    ...a,
    assigned_editor_name: a.assigned?.full_name || null,
    category_name: a.category?.name || null,
  }));

  const staff = staffResult.data || [];

  return (
    <ArticlesClient 
      articles={articles} 
      staff={staff} 
      currentUser={{ id: user.id, role: profile.role }} 
    />
  );
}
