import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  const isSuperAdmin = profile?.role === 'super_admin';

  // ── Real metrics ────────────────────────────────────────────
  const [
    { count: totalArticles },
    { count: publishedArticles },
    { count: draftArticles },
    { count: inReviewArticles },
    { count: totalViews },
    { count: totalCategories },
    { count: totalUsers },
    { data: recentUsers },
    { data: recentArticles },
  ] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published').eq('is_deleted', false),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft').eq('is_deleted', false),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'in_review').eq('is_deleted', false),
    supabase.from('article_views').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, full_name, email, avatar_url').order('created_at', { ascending: false }).limit(5),
    supabase.from('articles').select('id, title, status, published_at').eq('is_deleted', false).order('created_at', { ascending: false }).limit(5),
  ]);

  const initials = (profile?.full_name || user.email || 'A').charAt(0).toUpperCase();

  const quickActions = [
    { href: '/admin/articles/new',  label: 'New Article',    icon: 'M12 4v16m8-8H4',                                                                     color: '#0047ff' },
    { href: '/admin/articles',      label: 'All Articles',   icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9', color: '#0047ff' },
    { href: '/admin/categories',    label: 'Categories',     icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z', color: '#0047ff' },
    { href: '/admin/series',        label: 'Series',         icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', color: '#0047ff' },
    { href: '/admin/media',         label: 'Media Library',  icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', color: '#0047ff' },
    { href: '/admin/users',         label: 'Users & Roles',  icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: '#0047ff' },
  ];

  const statusColor = (s: string) => {
    if (s === 'published') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (s === 'in_review') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (s === 'archived')  return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  };

  return (
    <div className="min-h-screen pb-28 px-4 pt-2 bg-[#f4f5f8] dark:bg-[#181623] font-sans antialiased safe-area-pb text-gray-900 dark:text-white transition-colors">

      {/* ── Profile header ────────────────────────────────────── */}
      <header className="flex items-center justify-between py-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-[#8b88a0] uppercase tracking-widest">Admin Panel</p>
          <h1 className="text-xl font-black tracking-tight">
            {profile?.full_name ? `Hi, ${profile.full_name.split(' ')[0]} 👋` : 'Dashboard'}
          </h1>
          <p className="text-[11px] text-gray-400 dark:text-[#8b88a0] mt-0.5 capitalize font-semibold">{profile?.role?.replace('_', ' ')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/articles/new"
            className="w-9 h-9 rounded-full bg-[#0047ff] text-white flex items-center justify-center shadow-lg shadow-[#0047ff]/30 active:scale-95 transition-transform">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          </Link>
          <div className="w-10 h-10 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-black text-base shadow-md">
            {initials}
          </div>
        </div>
      </header>

      {/* ── Metrics row ──────────────────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1 -mx-4 px-4 mb-6">
        {[
          { label: 'Total',     value: totalArticles ?? 0,    sub: 'articles',  color: '#0047ff' },
          { label: 'Published', value: publishedArticles ?? 0, sub: 'live',      color: '#10b981' },
          { label: 'In Review', value: inReviewArticles ?? 0,  sub: 'pending',   color: '#f59e0b' },
          { label: 'Draft',     value: draftArticles ?? 0,     sub: 'editing',   color: '#6b7280' },
          { label: 'Views',     value: (totalViews ?? 0).toLocaleString(), sub: 'total', color: '#8b5cf6' },
          { label: 'Users',     value: totalUsers ?? 0,        sub: 'registered', color: '#ec4899' },
          { label: 'Categories', value: totalCategories ?? 0,  sub: 'active',    color: '#0047ff' },
        ].map((m) => (
          <div key={m.label} className="snap-center shrink-0 w-[130px] bg-white dark:bg-[#242235] rounded-3xl p-4 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#8b88a0]">{m.label}</span>
            <span className="text-2xl font-black tracking-tight" style={{ color: m.color }}>{m.value}</span>
            <span className="text-[10px] text-gray-400 dark:text-[#8b88a0] font-semibold">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-[#8b88a0] mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href}
              className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-[#242235] border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white" style={{ background: a.color }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-center leading-tight text-gray-700 dark:text-gray-300">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent Articles ───────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-[#8b88a0]">Recent Articles</h2>
          <Link href="/admin/articles" className="text-[11px] font-bold text-[#0047ff] dark:text-[#ffe500]">View all →</Link>
        </div>
        <div className="space-y-2">
          {recentArticles?.map((a) => (
            <Link key={a.id} href={`/admin/articles/${a.id}/edit`}
              className="flex items-center justify-between gap-3 bg-white dark:bg-[#242235] border border-gray-100 dark:border-white/5 rounded-2xl px-4 py-3 shadow-sm active:scale-[0.99] transition-transform">
              <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-white truncate">{a.title}</span>
              <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor(a.status)}`}>
                {a.status.replace('_', ' ')}
              </span>
            </Link>
          ))}
          {(!recentArticles || recentArticles.length === 0) && (
            <div className="text-center py-8 text-gray-400 text-sm">No articles yet</div>
          )}
        </div>
      </section>

      {/* ── Recent Users ─────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-[#8b88a0]">Recent Users</h2>
          {isSuperAdmin && (
            <Link href="/admin/users" className="text-[11px] font-bold text-[#0047ff] dark:text-[#ffe500]">Manage →</Link>
          )}
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1">
          {recentUsers?.map((u) => (
            <div key={u.id} className="shrink-0 flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-bold text-base overflow-hidden shadow-sm">
                {u.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  : (u.full_name || u.email || '?').charAt(0).toUpperCase()
                }
              </div>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-[#8b88a0] max-w-[56px] truncate text-center">
                {u.full_name?.split(' ')[0] || 'User'}
              </span>
            </div>
          ))}
          {(!recentUsers || recentUsers.length === 0) && (
            <p className="text-xs text-gray-400">No users yet.</p>
          )}
        </div>
      </section>

      {/* ── Site link ─────────────────────────────────────────── */}
      <div className="flex justify-center">
        <Link href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-[#242235] border border-gray-100 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300 shadow-sm active:scale-95 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          View Live Site
        </Link>
      </div>

    </div>
  );
}
