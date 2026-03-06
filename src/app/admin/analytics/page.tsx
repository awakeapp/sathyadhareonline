import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AnalyticsCharts from './AnalyticsCharts';
import { Flame, MessageCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // ── Auth guard ──────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?error=unauthorized');
  }

  // ── Headline metrics ─────────────────────────────────────────────
  const { count: totalArticles } = await supabase
    .from('articles').select('*', { count: 'exact', head: true }).eq('is_deleted', false);

  const { count: publishedArticles } = await supabase
    .from('articles').select('*', { count: 'exact', head: true })
    .eq('status', 'published').eq('is_deleted', false);

  const { count: totalViews } = await supabase
    .from('article_views').select('*', { count: 'exact', head: true });

  // ── Retrieve Time Series Data for 90 days ─────────────────────────────────
  const DAYS = 90;
  const cutoff = new Date(new Date().getTime() - DAYS * 86400_000).toISOString();

  const [
    { data: viewRows },
    { data: userRows },
    { data: commentRows }
  ] = await Promise.all([
    supabase.from('article_views').select('created_at').gte('created_at', cutoff),
    supabase.from('profiles').select('created_at').gte('created_at', cutoff),
    supabase.from('comments').select('created_at').gte('created_at', cutoff)
  ]);

  const mapTimeSeries = () => {
    const map: Record<string, { views: number; users: number; comments: number }> = {};
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(new Date().getTime() - i * 86400_000).toISOString().slice(0, 10);
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

  // ── Top articles by views ────────────────────────────────────────
  const { data: allViewRows } = await supabase.from('article_views').select('article_id');
  const viewCounts: Record<string, number> = {};
  for (const row of allViewRows ?? []) {
    viewCounts[row.article_id] = (viewCounts[row.article_id] ?? 0) + 1;
  }
  const topViewIds = Object.entries(viewCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
  
  let topArticlesByViews: { id: string; title: string; slug: string }[] = [];
  if (topViewIds.length > 0) {
    const { data } = await supabase.from('articles').select('id, title, slug').in('id', topViewIds).eq('is_deleted', false);
    topArticlesByViews = (data ?? []).sort((a, b) => (viewCounts[b.id] ?? 0) - (viewCounts[a.id] ?? 0));
  }

  // ── Top articles by comments ────────────────────────────────────────
  const { data: allCommentRows } = await supabase.from('comments').select('article_id').eq('is_deleted', false);
  const commentCounts: Record<string, number> = {};
  for (const row of allCommentRows ?? []) {
    commentCounts[row.article_id] = (commentCounts[row.article_id] ?? 0) + 1;
  }
  const topCommentIds = Object.entries(commentCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);

  let topArticlesByComments: { id: string; title: string; slug: string }[] = [];
  if (topCommentIds.length > 0) {
    const { data } = await supabase.from('articles').select('id, title, slug').in('id', topCommentIds).eq('is_deleted', false);
    topArticlesByComments = (data ?? []).sort((a, b) => (commentCounts[b.id] ?? 0) - (commentCounts[a.id] ?? 0));
  }

  // ── Category breakdown ────────────────────────────────────────────
  const { data: catArticles } = await supabase
    .from('articles')
    .select('id, category_id, categories(id, name)')
    .eq('is_deleted', false)
    .not('category_id', 'is', null);

  const catMap: Record<string, { id: string; name: string; count: number; views: number }> = {};
  for (const row of catArticles ?? []) {
    const cat = row.categories as { id?: string; name?: string } | null;
    if (!cat?.name || !cat?.id) continue;
    
    if (!catMap[cat.id]) catMap[cat.id] = { id: cat.id, name: cat.name, count: 0, views: 0 };
    catMap[cat.id].count++;
    catMap[cat.id].views += (viewCounts[row.id] ?? 0);
  }
  const categoryStats = Object.values(catMap).sort((a, b) => b.count - a.count);


  // ── UI ───────────────────────────────────────────────────────────
  const statCards = [
    {
      label: 'Total Articles',
      value: totalArticles ?? 0,
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/20',
      iconColor: 'text-indigo-400',
    },
    {
      label: 'Published',
      value: publishedArticles ?? 0,
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Total Views',
      value: (totalViews ?? 0).toLocaleString(),
      icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      color: 'from-violet-500/20 to-violet-600/10 border-violet-500/20',
      iconColor: 'text-violet-400',
    },
  ];

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">Analytics</h1>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
              Platform Performance Overview
            </p>
          </div>
          <Link href="/admin"
            className="px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-muted)] hover:text-white transition-colors">
            ← Dashboard
          </Link>
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {statCards.map(s => (
            <div key={s.label} className={`bg-gradient-to-b ${s.color} border rounded-3xl p-5 shadow-lg`}>
              <svg className={`w-5 h-5 ${s.iconColor} mb-3`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
              </svg>
              <p className="text-2xl font-extrabold text-white tabular-nums">{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[var(--color-muted)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Interactive Charts + Exports ─────────────────────────── */}
        <AnalyticsCharts timeSeries={timeSeries} categoryStats={categoryStats} />

        {/* ── Top Articles Sections ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl shadow-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Top by Views</h2>
            </div>
            {topArticlesByViews.length === 0 ? (
              <div className="px-5 py-10 text-center text-[var(--color-muted)] text-sm">
                No view data yet.
              </div>
            ) : (
              <ol className="divide-y divide-[var(--color-border)]">
                {topArticlesByViews.map((article, idx) => {
                  const views = viewCounts[article.id] ?? 0;
                  const maxViews = viewCounts[topArticlesByViews[0].id] ?? 1;
                  const barWidth = Math.round((views / maxViews) * 100);
                  return (
                    <li key={article.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-extrabold ${
                          idx === 0 ? 'bg-[var(--color-primary)] text-black' :
                          idx === 1 ? 'bg-white/20 text-white' :
                          idx === 2 ? 'bg-amber-600/70 text-white' :
                          'bg-white/5 text-[var(--color-muted)]'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <Link href={`/articles/${article.slug}`} target="_blank"
                            className="text-sm font-semibold text-white hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                            {article.title}
                          </Link>
                          <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--color-primary)]/60 rounded-full" style={{ width: `${barWidth}%` }} />
                          </div>
                        </div>
                        <span className="flex-shrink-0 text-sm font-bold text-white tabular-nums">
                          {views.toLocaleString()}
                          <span className="text-[10px] font-normal text-[var(--color-muted)] ml-1">views</span>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl shadow-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-sky-500" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Top by Comments</h2>
            </div>
            {topArticlesByComments.length === 0 ? (
              <div className="px-5 py-10 text-center text-[var(--color-muted)] text-sm">
                No comment data yet.
              </div>
            ) : (
              <ol className="divide-y divide-[var(--color-border)]">
                {topArticlesByComments.map((article, idx) => {
                  const comments = commentCounts[article.id] ?? 0;
                  const maxComments = commentCounts[topArticlesByComments[0].id] ?? 1;
                  const barWidth = Math.round((comments / maxComments) * 100);
                  return (
                    <li key={article.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-extrabold ${
                          idx === 0 ? 'bg-sky-500 text-white' :
                          idx === 1 ? 'bg-sky-500/50 text-white' :
                          idx === 2 ? 'bg-sky-500/30 text-white' :
                          'bg-white/5 text-[var(--color-muted)]'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <Link href={`/articles/${article.slug}`} target="_blank"
                            className="text-sm font-semibold text-white hover:text-sky-400 transition-colors line-clamp-1">
                            {article.title}
                          </Link>
                          <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-500/60 rounded-full" style={{ width: `${barWidth}%` }} />
                          </div>
                        </div>
                        <span className="flex-shrink-0 text-sm font-bold text-white tabular-nums">
                          {comments.toLocaleString()}
                          <span className="text-[10px] font-normal text-[var(--color-muted)] ml-1">comms</span>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
