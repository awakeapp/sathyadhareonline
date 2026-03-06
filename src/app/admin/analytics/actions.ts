'use server';

import { createClient } from '@/lib/supabase/server';

export async function exportUsersCSV() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return { error: 'Forbidden' };

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };

  const header = ['ID', 'Email', 'Full Name', 'Role', 'Signup Date'];
  const rows = (users || []).map(u => [
    u.id,
    u.email || '',
    `"${(u.full_name || '').replace(/"/g, '""')}"`,
    u.role,
    new Date(u.created_at).toISOString()
  ]);

  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  return { csv, filename: `users_export_${new Date().toISOString().slice(0, 10)}.csv` };
}

export async function exportArticlesCSV() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return { error: 'Forbidden' };

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, status, published_at, profiles(full_name, email)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };

  // Fetch views per article
  const { data: viewCounts } = await supabase.from('article_views').select('article_id');
  const counts: Record<string, number> = {};
  for (const row of viewCounts || []) {
    counts[row.article_id] = (counts[row.article_id] || 0) + 1;
  }

  const header = ['ID', 'Title', 'Author', 'Status', 'Views', 'Published Date'];
  const rows = (articles || []).map(a => {
    const authorName = (a.profiles as { full_name?: string; email?: string } | null)?.full_name 
      || (a.profiles as { full_name?: string; email?: string } | null)?.email 
      || 'Unknown';
    return [
      a.id,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${authorName.replace(/"/g, '""')}"`,
      a.status,
      counts[a.id] || 0,
      a.published_at ? new Date(a.published_at).toISOString() : ''
    ];
  });

  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  return { csv, filename: `articles_export_${new Date().toISOString().slice(0, 10)}.csv` };
}

export async function exportViewsCSV() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return { error: 'Forbidden' };

  // For views, we might have too many rows. We'll aggregate by day.
  const { data: views, error } = await supabase
    .from('article_views')
    .select('created_at');

  if (error) return { error: error.message };

  const dailyCount: Record<string, number> = {};
  for (const row of views || []) {
    const d = row.created_at.slice(0, 10);
    dailyCount[d] = (dailyCount[d] || 0) + 1;
  }

  const header = ['Date', 'Views'];
  const rows = Object.entries(dailyCount).sort((a, b) => b[0].localeCompare(a[0])).map(([date, count]) => [date, count]);

  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  return { csv, filename: `daily_views_export_${new Date().toISOString().slice(0, 10)}.csv` };
}
