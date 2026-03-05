import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AnalyticsCharts from './AnalyticsCharts';

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

  // ── Per-day views — last 30 days ─────────────────────────────────
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
  const { data: viewRows30 } = await supabase
    .from('article_views')
    .select('created_at')
    .gte('created_at', since30);

  // Build a map date → count for both 7 and 30 day windows
  const todayStr = new Date().toISOString().slice(0, 10);
  function buildDayPoints(days: number) {
    const map: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      map[d] = 0;
    }
    for (const row of viewRows30 ?? []) {
      const d = row.created_at?.slice(0, 10);
      if (d && d in map) map[d]++;
    }
    return Object.entries(map).map(([date, views]) => ({ date, views }));
  }

  const days7  = buildDayPoints(7);
  const days30 = buildDayPoints(30);

  // ── Top articles by views ────────────────────────────────────────
  const { data: allViewRows } = await supabase.from('article_views').select('article_id');
  const viewCounts: Record<string, number> = {};
  for (const row of allViewRows ?? []) {
    viewCounts[row.article_id] = (viewCounts[row.article_id] ?? 0) + 1;
  }
  const topIds = Object.entries(viewCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
  let topArticles: { id: string; title: string; slug: string }[] = [];
  if (topIds.length > 0) {
    const { data } = await supabase.from('articles').select('id, title, slug').in('id', topIds).eq('is_deleted', false);
    topArticles = (data ?? []).sort((a, b) => (viewCounts[b.id] ?? 0) - (viewCounts[a.id] ?? 0));
  }

  // ── Category breakdown ────────────────────────────────────────────
  const { data: catArticles } = await supabase
    .from('articles')
    .select('category_id, categories(name)')
    .eq('is_deleted', false)
    .not('category_id', 'is', null);

  const catMap: Record<string, { name: string; count: number }> = {};
  for (const row of catArticles ?? []) {
    const name = (row.categories as { name?: string } | null)?.name;
    if (!name || !row.category_id) continue;
    if (!catMap[row.category_id]) catMap[row.category_id] = { name, count: 0 };
    catMap[row.category_id].count++;
  }
  const categoryStats = Object.values(catMap).sort((a, b) => b.count - a.count);

  // Suppress unused warning
  void todayStr;

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
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">Analytics</h1>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
              Journal performance overview
            </p>
          </div>
          <Link href="/admin"
            className="px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:text-white transition-colors">
            ← Dashboard
          </Link>
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {statCards.map(s => (
            <div key={s.label} className={`bg-gradient-to-b ${s.color} border rounded-3xl p-4 shadow-lg`}>
              <svg className={`w-5 h-5 ${s.iconColor} mb-3`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
              </svg>
              <p className="text-2xl font-extrabold text-white tabular-nums">{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[var(--color-muted)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Interactive chart + category breakdown ───────────────── */}
        <AnalyticsCharts days7={days7} days30={days30} categoryStats={categoryStats} />

        {/* ── Top articles ─────────────────────────────────────────── */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-2">
            <span className="text-base">🔥</span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Top Articles by Views</h2>
          </div>
          {topArticles.length === 0 ? (
            <div className="px-5 py-10 text-center text-[var(--color-muted)] text-sm">
              No view data yet.
            </div>
          ) : (
            <ol className="divide-y divide-[var(--color-border)]">
              {topArticles.map((article, idx) => {
                const views = viewCounts[article.id] ?? 0;
                const maxViews = viewCounts[topArticles[0].id] ?? 1;
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

      </div>
    </div>
  );
}
