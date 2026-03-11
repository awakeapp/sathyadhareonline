'use server';

import { createClient } from '@/lib/supabase/server';
import { verifyRole } from '@/lib/auth-server';
import { logAuditEvent } from '@/lib/audit';

export async function exportUsersCSVAction(start: string, end: string) {
  try {
    const { user } = await verifyRole(['super_admin', 'admin']);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, status, created_at')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });

    if (error) throw error;

    await logAuditEvent(user.id, 'EXPORTED_USERS_REPORT', { start, end });

    // Format CSV
    const header = ['ID', 'Email', 'Full Name', 'Role', 'Status', 'Joined Date'].join(',');
    const rows = (data || []).map(r => 
      [r.id, r.email || '', (r.full_name || '').replace(/,/g, ''), r.role, r.status || 'active', r.created_at].join(',')
    );
    const csv = [header, ...rows].join('\n');
    return { csv, filename: `Users_Report_${start}_to_${end}.csv` };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function exportContentPerformanceCSVAction(start: string, end: string) {
  try {
    const { user } = await verifyRole(['super_admin', 'admin']);
    const supabase = await createClient();

    // views in range
    const { data: viewsData } = await supabase
      .from('article_views')
      .select('article_id')
      .gte('created_at', start)
      .lte('created_at', end);
    // comments in range
    const { data: commentsData } = await supabase
      .from('comments')
      .select('article_id')
      .gte('created_at', start)
      .lte('created_at', end)
      .eq('is_deleted', false);

    const counts: Record<string, { views: number, comments: number }> = {};
    for (const v of viewsData || []) {
      if (!counts[v.article_id]) counts[v.article_id] = { views: 0, comments: 0 };
      counts[v.article_id].views++;
    }
    for (const c of commentsData || []) {
      if (!counts[c.article_id]) counts[c.article_id] = { views: 0, comments: 0 };
      counts[c.article_id].comments++;
    }

    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, status')
      .not('id', 'is', null);

    const finalData = (articles || [])
      .map(a => ({
        ...a,
        views: counts[a.id]?.views || 0,
        comments: counts[a.id]?.comments || 0,
      }))
      .filter(a => a.views > 0 || a.comments > 0)
      .sort((a, b) => b.views - a.views);

    await logAuditEvent(user.id, 'EXPORTED_CONTENT_REPORT', { start, end });

    const header = ['ID', 'Title', 'Status', 'Views', 'Comments'].join(',');
    const rows = finalData.map(a => 
      [a.id, `"${(a.title || '').replace(/"/g, '""')}"`, a.status, a.views, a.comments].join(',')
    );
    return { csv: [header, ...rows].join('\n'), filename: `Content_Performance_${start}_to_${end}.csv` };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function exportCategoryCSVAction(start: string, end: string) {
  try {
    const { user } = await verifyRole(['super_admin', 'admin']);
    const supabase = await createClient();

    // articles with category
    const { data: catArticles } = await supabase
      .from('articles')
      .select('id, category_id, categories(name)')
      .eq('is_deleted', false)
      .not('category_id', 'is', null);

    // views in range
    const { data: viewRows } = await supabase
      .from('article_views')
      .select('article_id')
      .gte('created_at', start)
      .lte('created_at', end);

    const viewCounts: Record<string, number> = {};
    for (const v of viewRows || []) {
      viewCounts[v.article_id] = (viewCounts[v.article_id] || 0) + 1;
    }

    const catMap: Record<string, { name: string, articles: number, views: number }> = {};
    for (const a of catArticles || []) {
      const c = a.categories as { name?: string } | null;
      if (!c?.name || !a.category_id) continue;
      if (!catMap[a.category_id]) catMap[a.category_id] = { name: c.name, articles: 0, views: 0 };
      catMap[a.category_id].articles++;
      catMap[a.category_id].views += viewCounts[a.id] || 0;
    }

    await logAuditEvent(user.id, 'EXPORTED_CATEGORY_REPORT', { start, end });

    const header = ['Category ID', 'Name', 'Total Articles', 'Total Views'].join(',');
    const rows = Object.entries(catMap).map(([id, stats]) => 
      [id, `"${stats.name.replace(/"/g, '""')}"`, stats.articles, stats.views].join(',')
    );
    return { csv: [header, ...rows].join('\n'), filename: `Category_Breakdown_${start}_to_${end}.csv` };
  } catch (err: any) {
    return { error: err.message };
  }
}
