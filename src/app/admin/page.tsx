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

  // ── Metrics ─────────────────────────────────────────────────
  const { count: totalArticles } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('is_deleted', false);

  const { count: publishedArticles } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('is_deleted', false);

  const { count: totalViews } = await supabase
    .from('article_views')
    .select('*', { count: 'exact', head: true });

  const { count: totalCategories } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true });

  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(4);

  return (
    <div className="min-h-screen pb-24 px-4 pt-2 bg-[#f4f5f8] dark:bg-[#181623] font-sans antialiased safe-area-pb text-gray-900 dark:text-white transition-colors">
      
      {/* ── Top Nav Header ──────────────────────────────────────── */}
      <header className="flex items-center justify-between mb-8">
        <div className="w-10 h-10 rounded-2xl bg-[#0f52ba] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#0f52ba]/30">
          S
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-white dark:bg-[#242235] border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-500 dark:text-[var(--color-muted)] shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button className="w-10 h-10 rounded-full bg-white dark:bg-[#242235] border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-500 dark:text-[var(--color-muted)] shadow-sm">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shadow-sm border border-white dark:border-gray-800">
            {profile?.full_name ? (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-[#ffe500] text-black uppercase">
                {profile.full_name.charAt(0)}
              </div>
            ) : (
              <svg className="w-full h-full text-gray-400 mt-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c-4.418 0-8 2.686-8 6h16c0-3.314-3.582-6-8-6zM12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
              </svg>
            )}
          </div>
        </div>
      </header>

      {/* ── Top Horizontal Insights Cards ───────────────────────── */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 -mx-4 px-4">
        
        {/* Card 1 */}
        <div className="snap-center shrink-0 w-[180px] bg-white dark:bg-[#242235] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-gray-500 dark:text-[#8b88a0]">Articles total</span>
            <span className="text-gray-400 dark:text-[#8b88a0]">•••</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0f52ba] text-white flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9" />
              </svg>
            </div>
            <span className="text-2xl font-black">{totalArticles ?? 0}+</span>
          </div>
          <div className="mt-4 text-[10px] font-bold text-emerald-500 tracking-wide">
            +9.1% increase
          </div>
        </div>

        {/* Card 2 */}
        <div className="snap-center shrink-0 w-[180px] bg-white dark:bg-[#242235] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-gray-500 dark:text-[#8b88a0]">Categories active</span>
            <span className="text-gray-400 dark:text-[#8b88a0]">•••</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0f52ba] text-white flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <span className="text-2xl font-black">{totalCategories ?? 0}+</span>
          </div>
          <div className="mt-4 text-[10px] font-bold text-emerald-500 tracking-wide">
            +12.1% increase
          </div>
        </div>

        {/* Card 3 (Placeholder for Deals) */}
        <div className="snap-center shrink-0 w-[180px] bg-white dark:bg-[#242235] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-gray-500 dark:text-[#8b88a0]">Published</span>
            <span className="text-gray-400 dark:text-[#8b88a0]">•••</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0f52ba] text-white flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-black">{publishedArticles ?? 0}+</span>
          </div>
          <div className="mt-4 text-[10px] font-bold text-emerald-500 tracking-wide">
            +2.4% increase
          </div>
        </div>

      </div>

      {/* ── Overview Section ──────────────────────────────────────── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight">Overview</h2>
          <div className="px-3 py-1.5 rounded-full bg-white dark:bg-[#242235] border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-1.5 cursor-pointer">
            <span className="text-xs font-medium text-gray-400 dark:text-[#8b88a0]">Last 30 days</span>
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        <div className="flex gap-4 flex-col sm:flex-row">
          {/* Main Primary Card */}
          <div className="flex-1 bg-[#0047ff] text-white rounded-3xl p-6 shadow-xl shadow-[#0047ff]/20 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="font-semibold opacity-90">Total Views</span>
            </div>
            <div>
              <div className="text-4xl font-black tracking-tighter mb-2">{(totalViews ?? 0).toLocaleString()}+</div>
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 rounded-lg bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm">
                  ↑ 4.6%
                </div>
                <span className="text-[10px] text-white/60">vs last month</span>
              </div>
            </div>
          </div>

          {/* Secondary White Card */}
          <div className="flex-1 bg-white dark:bg-[#242235] text-gray-900 dark:text-white border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
             <div className="flex items-center gap-2 mb-4 text-gray-600 dark:text-[#8b88a0]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="font-semibold">Registered Users</span>
            </div>
            <div>
              <div className="text-4xl font-black tracking-tighter mb-2">368+</div>
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-bold flex items-center gap-1">
                  ↓ 4.6%
                </div>
                <span className="text-[10px] text-gray-400 dark:text-[#8b88a0]">vs last month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Action Row ─────────────────────────────────────── */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Recent sign-ups today!
        </h3>
        <div className="flex items-center justify-between">
          {recentUsers?.map((u, i) => (
             <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 overflow-hidden border-2 border-white dark:border-[#181623] shadow-sm shadow-black/5 flex items-center justify-center font-bold text-indigo-500 relative">
                {u.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={u.avatar_url} alt={u.full_name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  u.full_name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
               <span className="text-[11px] font-semibold text-gray-600 dark:text-[#8b88a0]">
                 {u.full_name?.split(' ')[0] || 'User'}
               </span>
             </div>
          ))}
          {(!recentUsers || recentUsers.length === 0) && (
            <span className="text-xs text-gray-400">No recent users.</span>
          )}
        </div>
      </div>

      {/* ── Quick Actions Grid ──────────────────────────────────── */}
      <div className="mt-8 mb-6">
        <h2 className="text-lg font-bold tracking-tight mb-4">Quick Actions</h2>
        <div className="flex justify-between md:justify-start md:gap-8 items-start">
          
          <Link href="/admin/articles/new" className="flex flex-col items-center gap-3 w-16 group">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#242235] border border-gray-100 dark:border-white/5 flex items-center justify-center shadow-sm shrink-0 transition-transform group-active:scale-95 group-hover:border-blue-500/30">
              <div className="w-8 h-8 rounded-full bg-[#0047ff] text-white flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">New Article</span>
          </Link>

          <Link href="/admin/categories/new" className="flex flex-col items-center gap-3 w-16 group">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#242235] border border-gray-100 dark:border-white/5 flex items-center justify-center shadow-sm shrink-0 transition-transform group-active:scale-95 group-hover:border-blue-500/30">
              <div className="w-8 h-8 rounded-full bg-[#0047ff] text-white flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">Add Category</span>
          </Link>

          <Link href="/admin/users" className="flex flex-col items-center gap-3 w-16 group">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#242235] border border-gray-100 dark:border-white/5 flex items-center justify-center shadow-sm shrink-0 transition-transform group-active:scale-95 group-hover:border-blue-500/30">
              <div className="w-8 h-8 rounded-full bg-[#0047ff] text-white flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">Manage Users</span>
          </Link>

          <Link href="/admin/submissions" className="flex flex-col items-center gap-3 w-16 group">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#242235] border border-gray-100 dark:border-white/5 flex items-center justify-center shadow-sm shrink-0 transition-transform group-active:scale-95 group-hover:border-blue-500/30">
              <div className="w-8 h-8 rounded-full bg-[#0047ff] text-white flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">Guest Replies</span>
          </Link>

        </div>
      </div>

    </div>
  );
}
