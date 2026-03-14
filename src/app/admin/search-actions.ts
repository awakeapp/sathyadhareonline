'use server';

import { createClient } from '@/lib/supabase/server';

export type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  type: 'article' | 'category' | 'user' | 'submission' | 'sequel' | 'comment' | 'page';
  href: string;
};

export const ADMIN_PAGES: { title: string; subtitle: string; href: string }[] = [
  { title: 'Articles', subtitle: 'Admin Section', href: '/admin/articles' },
  { title: 'New Article', subtitle: 'Content Action', href: '/admin/articles/new' },
  { title: 'Categories', subtitle: 'Admin Section', href: '/admin/categories' },
  { title: 'Sequels', subtitle: 'Admin Section', href: '/admin/sequels' },
  { title: 'Users', subtitle: 'Admin Section', href: '/admin/users' },
  { title: 'Submissions', subtitle: 'Admin Section', href: '/admin/submissions' },
  { title: 'Comments', subtitle: 'Admin Section', href: '/admin/comments' },
  { title: 'Analytics', subtitle: 'Admin Section', href: '/admin/analytics' },
  { title: 'Newsletter', subtitle: 'Admin Section', href: '/admin/newsletter' },
  { title: 'Friday Messages', subtitle: 'Admin Section', href: '/admin/friday' },
  { title: 'Audit Logs', subtitle: 'Admin Section', href: '/admin/audit-logs' },
  { title: 'Security', subtitle: 'Admin Section', href: '/admin/security' },
  { title: 'Settings', subtitle: 'Admin Section', href: '/admin/settings' },
  { title: 'Media Library', subtitle: 'Admin Section', href: '/admin/media' },
  { title: 'Trash Manager', subtitle: 'Admin Section', href: '/admin/trash' },
];

export async function globalSearchAction(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const supabase = await createClient();
  const q = query.trim().toLowerCase();

  // Perform all database queries in parallel for maximum speed
  const [
    { data: articles },
    { data: sequels },
    { data: categories },
    { data: profiles },
    { data: comments },
    { data: submissions }
  ] = await Promise.all([
    supabase.from('articles').select('id, title').ilike('title', `%${q}%`).eq('is_deleted', false).limit(5),
    supabase.from('sequels').select('id, title').ilike('title', `%${q}%`).eq('is_deleted', false).limit(3),
    supabase.from('categories').select('id, name').ilike('name', `%${q}%`).limit(3),
    supabase.from('profiles').select('id, full_name, email, role').or(`full_name.ilike.%${q}%,email.ilike.%${q}%`).limit(3),
    supabase.from('comments').select('id, content, guest_name').ilike('content', `%${q}%`).limit(3),
    supabase.from('guest_submissions').select('id, title, name').or(`title.ilike.%${q}%,name.ilike.%${q}%`).limit(3)
  ]);

  const results: SearchResult[] = [];

  // Add Articles
  articles?.forEach(a => results.push({ id: a.id, title: a.title, subtitle: 'Article Result', type: 'article', href: `/admin/articles/${a.id}/edit` }));

  // Add Sequels
  sequels?.forEach(s => results.push({ id: s.id, title: s.title, subtitle: 'Sequel Series', type: 'sequel', href: `/admin/sequels/${s.id}/edit` }));

  // Add Categories
  categories?.forEach(c => results.push({ id: c.id, title: c.name, subtitle: 'Content Category', type: 'category', href: `/admin/categories` }));

  // Add Profiles
  profiles?.forEach(p => results.push({ id: p.id, title: p.full_name || p.email || 'Unknown User', subtitle: `User Profile (${p.role})`, type: 'user', href: `/admin/users?q=${encodeURIComponent(p.email || '')}` }));

  // Add Comments
  comments?.forEach(c => results.push({ id: c.id, title: c.content?.slice(0, 40) + (c.content?.length > 40 ? '...' : ''), subtitle: `Comment by ${c.guest_name || 'User'}`, type: 'comment', href: `/admin/comments` }));

  // Add Submissions
  submissions?.forEach(s => results.push({ id: s.id, title: s.title || 'Guest Submission', subtitle: `Submission by ${s.name}`, type: 'submission', href: `/admin/submissions` }));

  return results;
}
