import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Status badge metadata
const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Draft',     cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  in_review: { label: 'In Review', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  published: { label: 'Published', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  archived:  { label: 'Archived',  cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export default async function EditorArticlesPage() {
  const supabase = await createClient();

  // Auth + role guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();

  if (!profile || profile.role !== 'editor') redirect('/login');

  // ── Articles scoped to this editor ──────────────────────────────
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, status, slug, updated_at, created_at')
    .eq('author_id', user.id)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false });

  if (error) console.error('Error fetching articles:', error);

  // ── View counts (join article_views) ────────────────────────────
  // Fetch all view rows for this author's articles in one query
  const articleIds = (articles ?? []).map(a => a.id);
  let viewCounts: Record<string, number> = {};

  if (articleIds.length > 0) {
    const { data: viewRows } = await supabase
      .from('article_views')
      .select('article_id')
      .in('article_id', articleIds);

    for (const row of viewRows ?? []) {
      viewCounts[row.article_id] = (viewCounts[row.article_id] ?? 0) + 1;
    }
  }

  return (
    <div className="min-h-full pb-16 px-5 pt-8 max-w-3xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">My Articles</h1>
          <p className="text-xs text-white/40 mt-0.5 uppercase tracking-wider font-semibold">
            {articles?.length ?? 0} article{articles?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/editor/articles/new"
          className="flex items-center gap-1.5 bg-[var(--color-primary)] text-black px-4 py-2.5 rounded-full text-sm font-bold hover:bg-[#ffed4a] transition-all shadow-lg shadow-[var(--color-primary)]/20 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          New Article
        </Link>
      </div>

      {/* ── Workflow legend ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <span key={key} className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.cls}`}>
            {meta.label}
          </span>
        ))}
      </div>

      {/* ── Article list ─────────────────────────────────────────── */}
      {!articles || articles.length === 0 ? (
        <div className="py-20 text-center text-white/40 bg-[#181623] border border-white/5 rounded-3xl">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9" />
          </svg>
          <p className="font-semibold text-white/60 mb-1">No articles yet</p>
          <p className="text-sm">Create your first article to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map(article => {
            const status = article.status ?? 'draft';
            const meta   = STATUS_META[status] ?? STATUS_META.draft;
            const views  = viewCounts[article.id] ?? 0;

            return (
              <div
                key={article.id}
                className="bg-[#181623] border border-white/5 rounded-2xl p-4 flex items-start gap-4 hover:border-white/10 transition-colors group"
              >
                {/* Status indicator bar */}
                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                  status === 'published' ? 'bg-emerald-500' :
                  status === 'in_review'  ? 'bg-amber-500' :
                  status === 'archived'   ? 'bg-purple-500' :
                  'bg-gray-600'
                }`} />

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1.5 flex-wrap">
                    <h3 className="font-bold text-white text-sm leading-snug">{article.title}</h3>
                    <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Meta row: updated + views */}
                  <div className="flex items-center gap-3 text-[11px] text-white/30 font-medium">
                    <span>
                      Updated {new Date(article.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {views.toLocaleString()} view{views !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* View in reader (only if published or has slug) */}
                  {article.slug && status === 'published' && (
                    <Link
                      href={`/articles/${article.slug}`}
                      target="_blank"
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-white/5 text-white/40 border border-white/8 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      View
                    </Link>
                  )}
                  <Link
                    href={`/editor/articles/${article.id}/edit`}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
