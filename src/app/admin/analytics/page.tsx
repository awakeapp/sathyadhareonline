import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Admin guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/');

  // ── Metrics ─────────────────────────────────────────────────

  // Total articles (not deleted)
  const { count: totalArticles } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('is_deleted', false);

  // Published articles
  const { count: publishedArticles } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('is_deleted', false);

  // Total views
  const { count: totalViews } = await supabase
    .from('article_views')
    .select('*', { count: 'exact', head: true });

  // ── Top Articles by Views ────────────────────────────────────
  const { data: viewRows } = await supabase
    .from('article_views')
    .select('article_id');

  const viewCounts: Record<string, number> = {};
  for (const row of viewRows ?? []) {
    viewCounts[row.article_id] = (viewCounts[row.article_id] ?? 0) + 1;
  }

  const topIds = Object.entries(viewCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  let topArticles: { id: string; title: string; slug: string }[] = [];
  if (topIds.length > 0) {
    const { data } = await supabase
      .from('articles')
      .select('id, title, slug')
      .in('id', topIds)
      .eq('is_deleted', false);

    topArticles = (data ?? []).sort(
      (a, b) => (viewCounts[b.id] ?? 0) - (viewCounts[a.id] ?? 0)
    );
  }

  const stats = [
    {
      label: 'Total Articles',
      value: totalArticles ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'from-indigo-500 to-indigo-600',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
    },
    {
      label: 'Published',
      value: publishedArticles ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      label: 'Total Views',
      value: (totalViews ?? 0).toLocaleString(),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: 'from-violet-500 to-violet-600',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">Overview of your journal performance</p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-gray-500 hover:text-gray-800 font-medium bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex p-3 rounded-xl ${s.bg} ${s.text} mb-4`}>
              {s.icon}
            </div>
            <p className="text-sm font-semibold text-gray-500 mb-1">{s.label}</p>
            <p className="text-4xl font-extrabold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Top Articles */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <h2 className="text-lg font-bold text-gray-900">Top Articles by Views</h2>
        </div>

        {topArticles.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            No view data yet. Views will appear here once articles are read.
          </div>
        ) : (
          <ol className="divide-y divide-gray-50">
            {topArticles.map((article, idx) => {
              const views = viewCounts[article.id] ?? 0;
              const maxViews = viewCounts[topArticles[0].id] ?? 1;
              const barWidth = Math.round((views / maxViews) * 100);

              return (
                <li key={article.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <span className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-extrabold ${
                      idx === 0 ? 'bg-yellow-400 text-white' :
                      idx === 1 ? 'bg-gray-300 text-gray-700' :
                      idx === 2 ? 'bg-amber-600/80 text-white' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {idx + 1}
                    </span>

                    {/* Title + bar */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/articles/${article.slug}`}
                        target="_blank"
                        className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1"
                      >
                        {article.title}
                      </Link>
                      {/* Progress bar */}
                      <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 rounded-full"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>

                    {/* View count */}
                    <span className="flex-shrink-0 text-sm font-bold text-gray-700 tabular-nums">
                      {views.toLocaleString()}
                      <span className="text-xs font-normal text-gray-400 ml-1">views</span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
