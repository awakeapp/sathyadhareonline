import { createClient } from '@/lib/supabase/server';
import LibraryClient from './LibraryClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Library | Admin' };
export const dynamic = 'force-dynamic';

export default async function LibraryAdminPage() {
  const supabase = await createClient();

  // Fix: Add missing role check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'super_admin', 'editor'].includes(profile.role)) {
    redirect('/admin?denied=1');
  }

  // Fix #7: Permission Enforcement
  if (profile.role !== 'super_admin') {
    const { data: permissions } = await supabase
      .from('user_content_permissions')
      .select('can_library')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!permissions || !permissions.can_library) {
      redirect('/admin?denied=1');
    }
  }

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch articles to allow adding them as chapters
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, category:categories(name)')
    .eq('is_deleted', false)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  const mappedArticles = (articles || []).map(a => ({
    id: a.id,
    title: a.title,
    category: a.category as { name: string } | { name: string }[] | null,
  }));

  return <LibraryClient initialBooks={books || []} availableArticles={mappedArticles} />;
}
