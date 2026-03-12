import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import AnalyticsClient from './AnalyticsClient';
import { differenceInDays, parseISO, isValid } from 'date-fns';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?error=unauthorized');
  }

  const params = await searchParams;
  const startParam = typeof params.start === 'string' ? params.start : null;
  const endParam = typeof params.end === 'string' ? params.end : null;

  let endDate = new Date(); 
  let startDate = new Date(endDate.getTime() - 30 * 86400000); 

  if (startParam && isValid(parseISO(startParam))) startDate = parseISO(startParam);
  if (endParam && isValid(parseISO(endParam))) endDate = parseISO(endParam);

  if (startDate > endDate) {
    const temp = startDate;
    startDate = endDate;
    endDate = temp;
  }

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();
  const daysDiff = Math.max(1, Math.min(differenceInDays(endDate, startDate) + 1, 365));

  const { count: totalArticles } = await supabase
    .from('articles').select('*', { count: 'exact', head: true }).eq('is_deleted', false);
  const { count: publishedArticles } = await supabase
    .from('articles').select('*', { count: 'exact', head: true })
    .eq('status', 'published').eq('is_deleted', false);

  const [
    { data: viewRows },
    { data: userRows },
    { data: commentRows }
  ] = await Promise.all([
    supabase.from('article_views').select('created_at').gte('created_at', startISO).lte('created_at', endISO),
    supabase.from('profiles').select('created_at').gte('created_at', startISO).lte('created_at', endISO),
    supabase.from('comments').select('created_at').gte('created_at', startISO).lte('created_at', endISO)
  ]);

  const mapTimeSeries = () => {
    const map: Record<string, { views: number; users: number; comments: number }> = {};
    for (let i = daysDiff - 1; i >= 0; i--) {
      const d = new Date(endDate.getTime() - i * 86400000).toISOString().slice(0, 10);
      map[d] = { views: 0, users: 0, comments: 0 };
    }
    for (const row of viewRows ?? []) {
      const d = row.created_at?.slice(0, 10);
      if (d && map[d]) map[d].views++;
    }
    for (const row of userRows ?? []) {
      const d = row.created_at?.slice(0, 10);
      if (d && map[d]) map[d].users++;
    }
    for (const row of commentRows ?? []) {
      const d = row.created_at?.slice(0, 10);
      if (d && map[d]) map[d].comments++;
    }
    return Object.entries(map).map(([date, data]) => ({ date, ...data }));
  };

  const timeSeries = mapTimeSeries();
  const rangeViews = timeSeries.reduce((acc, curr) => acc + curr.views, 0);

  const viewCounts: Record<string, number> = {};
  const { data: viewDataWithIds } = await supabase.from('article_views').select('article_id').gte('created_at', startISO).lte('created_at', endISO);
  
  for (const row of viewDataWithIds ?? []) {
    viewCounts[row.article_id] = (viewCounts[row.article_id] ?? 0) + 1;
  }
  const topViewIds = Object.entries(viewCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);
  
  let topArticlesByViews: { id: string; title: string; slug: string }[] = [];
  if (topViewIds.length > 0) {
    const { data } = await supabase.from('articles').select('id, title, slug').in('id', topViewIds).eq('is_deleted', false);
    topArticlesByViews = (data ?? []).sort((a, b) => (viewCounts[b.id] ?? 0) - (viewCounts[a.id] ?? 0));
  }

  const { data: commentDataWithIds } = await supabase.from('comments').select('article_id').gte('created_at', startISO).lte('created_at', endISO).eq('is_deleted', false);
  const commentCounts: Record<string, number> = {};
  for (const row of commentDataWithIds ?? []) {
    commentCounts[row.article_id] = (commentCounts[row.article_id] ?? 0) + 1;
  }
  const topCommentIds = Object.entries(commentCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);

  let topArticlesByComments: { id: string; title: string; slug: string }[] = [];
  if (topCommentIds.length > 0) {
    const { data } = await supabase.from('articles').select('id, title, slug').in('id', topCommentIds).eq('is_deleted', false);
    topArticlesByComments = (data ?? []).sort((a, b) => (commentCounts[b.id] ?? 0) - (commentCounts[a.id] ?? 0));
  }

  const { data: catArticles } = await supabase
    .from('articles')
    .select('id, category_id, categories(id, name)')
    .eq('is_deleted', false)
    .not('category_id', 'is', null);

  const catMap: Record<string, { id: string; name: string; count: number; views: number }> = {};
  for (const row of catArticles ?? []) {
    const cat = row.categories as any;
    if (!cat?.name || !cat?.id) continue;
    
    if (!catMap[cat.id]) catMap[cat.id] = { id: cat.id, name: cat.name, count: 0, views: 0 };
    catMap[cat.id].count++;
    catMap[cat.id].views += (viewCounts[row.id] ?? 0);
  }
  const categoryStats = Object.values(catMap).sort((a, b) => b.count - a.count);

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Super Admin"
        roleLabel="Analytics Intelligence · Range Discovery"
        initials={initials}
        icon1Node={<Bell className="w-6 h-6" strokeWidth={1.25} />}
        icon2Node={<ChevronLeft className="w-6 h-6" strokeWidth={1.25} />}
        icon2Href="/admin"
      />
      
      <div className="p-4 flex flex-col gap-4 relative z-20">
        <AnalyticsClient
          startDate={startISO}
          endDate={endISO}
          timeSeries={timeSeries}
          topArticlesByViews={topArticlesByViews.map(a => ({ ...a, count: viewCounts[a.id] || 0 }))}
          topArticlesByComments={topArticlesByComments.map(a => ({ ...a, count: commentCounts[a.id] || 0 }))}
          categoryStats={categoryStats}
          totals={{
            articles: totalArticles ?? 0,
            published: publishedArticles ?? 0,
            viewsInRange: rangeViews
          }}
        />
      </div>
    </PresenceWrapper>
  );
}
