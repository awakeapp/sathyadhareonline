import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EditorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role, full_name').eq('id', user.id).single();

  if (!profile || profile.role !== 'editor') redirect('/login');

  const name = profile.full_name ?? 'Editor';

  // ── Stats ────────────────────────────────────────────────────────
  const { count: totalCount } = await supabase
    .from('articles').select('*', { count: 'exact', head: true })
    .eq('author_id', user.id).eq('is_deleted', false);

  const { count: publishedCount } = await supabase
    .from('articles').select('*', { count: 'exact', head: true })
    .eq('author_id', user.id).eq('status', 'published').eq('is_deleted', false);

  const { count: draftCount } = await supabase
    .from('articles').select('*', { count: 'exact', head: true })
    .eq('author_id', user.id).eq('status', 'draft').eq('is_deleted', false);

  const { count: reviewCount } = await supabase
    .from('articles').select('*', { count: 'exact', head: true })
    .eq('author_id', user.id).eq('status', 'in_review').eq('is_deleted', false);

  // ── Recent articles ──────────────────────────────────────────────
  const { data: recent } = await supabase
    .from('articles')
    .select('id, title, status, updated_at, slug')
    .eq('author_id', user.id)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })
    .limit(5);

  const statusMeta: Record<string, { label: string; cls: string }> = {
    draft:     { label: 'Draft',      cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
    in_review: { label: 'In Review',  cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    published: { label: 'Published',  cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    archived:  { label: 'Archived',   cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  };

  const stats = [
    { label: 'Total Articles', value: totalCount ?? 0, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Published',      value: publishedCount ?? 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'In Review',      value: reviewCount ?? 0, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Drafts',         value: draftCount ?? 0, color: 'text-gray-300', bg: 'bg-gray-500/10 border-gray-500/20' },
  ];

  return (
    <div className="min-h-full pb-16 px-5 pt-8 max-w-3xl mx-auto">

      {/* ── Welcome header ──────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest font-semibold text-violet-400 mb-1">Editor Workspace</p>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Welcome back, {name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-white/40 mt-1">Here&apos;s what&apos;s happening with your articles today.</p>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-extrabold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Quick actions ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <Link href="/editor/articles/new"
          className="flex items-center gap-4 p-5 rounded-2xl bg-violet-600/15 border border-violet-500/25 hover:bg-violet-600/25 transition-all group">
          <div className="w-11 h-11 rounded-xl bg-violet-600/25 flex items-center justify-center text-violet-300 flex-shrink-0 group-hover:bg-violet-600/40 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-white text-sm">Write New Article</p>
            <p className="text-xs text-white/40 mt-0.5">Start a fresh draft</p>
          </div>
          <svg className="w-4 h-4 text-white/20 ml-auto group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" /></svg>
        </Link>

        <Link href="/editor/articles"
          className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.04] border border-white/8 hover:bg-white/[0.07] transition-all group">
          <div className="w-11 h-11 rounded-xl bg-white/8 flex items-center justify-center text-white/50 flex-shrink-0 group-hover:bg-white/15 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-white text-sm">My Articles</p>
            <p className="text-xs text-white/40 mt-0.5">{totalCount ?? 0} article{totalCount !== 1 ? 's' : ''} total</p>
          </div>
          <svg className="w-4 h-4 text-white/20 ml-auto group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" /></svg>
        </Link>
      </div>

      {/* ── Recent articles ──────────────────────────────────────── */}
      <div className="bg-[#181623] border border-white/5 rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Activity</h2>
          <Link href="/editor/articles" className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors">
            View all →
          </Link>
        </div>

        {!recent || recent.length === 0 ? (
          <div className="py-14 text-center text-white/30">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9" /></svg>
            <p className="text-sm font-semibold text-white/40">No articles yet</p>
            <p className="text-xs mt-1 text-white/20">Write your first article to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recent.map(a => {
              const meta = statusMeta[a.status] ?? statusMeta.draft;
              return (
                <div key={a.id} className="flex items-center px-5 py-3.5 gap-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{a.title}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">
                      Updated {new Date(a.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${meta.cls}`}>
                    {meta.label}
                  </span>
                  <Link href={`/editor/articles/${a.id}/edit`}
                    className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-[11px] font-bold uppercase tracking-wider transition-colors">
                    Edit
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
