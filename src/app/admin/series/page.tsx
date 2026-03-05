import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SeriesListPage() {
  const supabase = await createClient();

  // ── Auth ─────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin', 'editor'].includes(profile.role)) {
    redirect('/admin');
  }

  // ── Fetch series with article count ──────────────────────────
  const { data: seriesList } = await supabase
    .from('sequels')
    .select('id, title, slug, description, status, created_at, sequel_articles(count)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  // ── Server Actions ───────────────────────────────────────────

  async function createSeriesAction(formData: FormData) {
    'use server';
    const title       = (formData.get('title') as string)?.trim();
    const slug        = (formData.get('slug') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();

    if (!title || !slug) return;

    const supabaseAction = await createClient();
    const { data: { user: actionUser } } = await supabaseAction.auth.getUser();
    if (!actionUser) return;

    const { error } = await supabaseAction
      .from('sequels')
      .insert({ title, slug, description: description || null, status: 'draft' });

    if (error) { console.error('Create series error:', error); return; }

    revalidatePath('/admin/series');
    redirect('/admin/series');
  }

  async function deleteSeriesAction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;

    const supabaseAction = await createClient();
    const { data: { user: actionUser } } = await supabaseAction.auth.getUser();
    if (!actionUser) return;

    const { data: p } = await supabaseAction.from('profiles').select('role').eq('id', actionUser.id).single();
    if (!p || !['admin', 'super_admin'].includes(p.role)) return;

    await supabaseAction.from('sequels').update({ is_deleted: true }).eq('id', id);

    revalidatePath('/admin/series');
    redirect('/admin/series');
  }

  async function togglePublishAction(formData: FormData) {
    'use server';
    const id     = formData.get('id') as string;
    const status = formData.get('status') as string;
    if (!id) return;

    const supabaseAction = await createClient();
    const next = status === 'published' ? 'draft' : 'published';
    const payload: Record<string, unknown> = { status: next };
    if (next === 'published') payload.published_at = new Date().toISOString();

    await supabaseAction.from('sequels').update(payload).eq('id', id);

    revalidatePath('/admin/series');
    redirect('/admin/series');
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white safe-area-pb">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-white transition-colors active:scale-95">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight leading-tight">Series</h1>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
                {seriesList?.length ?? 0} collections
              </p>
            </div>
          </div>
        </div>

        {/* ── Create Form ─────────────────────────────────────── */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-xl">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-muted)] mb-5">New Series</h2>
          <form action={createSeriesAction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Title *</label>
                <input
                  required
                  name="title"
                  type="text"
                  placeholder="Series title"
                  className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-white/20 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Slug *</label>
                <input
                  required
                  name="slug"
                  type="text"
                  placeholder="series-slug"
                  className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-white/20 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                name="description"
                rows={2}
                placeholder="Brief description of this series…"
                className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-white/20 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all resize-none text-sm"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Create Series
              </button>
            </div>
          </form>
        </div>

        {/* ── Series List ─────────────────────────────────────── */}
        {!seriesList || seriesList.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/20">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-white/50 text-sm font-semibold">No series yet</p>
            <p className="text-white/25 text-xs">Create your first series above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {seriesList.map((series) => {
              const articleCount = (series.sequel_articles as unknown as { count: number }[])?.[0]?.count ?? 0;
              const isPublished  = series.status === 'published';

              return (
                <div
                  key={series.id}
                  className={`bg-[var(--color-surface)] border rounded-3xl p-5 transition-all ${
                    isPublished
                      ? 'border-emerald-500/20 shadow-emerald-500/5 shadow-lg'
                      : 'border-[var(--color-border)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-white text-base leading-tight truncate">{series.title}</h3>
                        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          isPublished
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {series.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[var(--color-muted)]">/{series.slug}</p>
                      {series.description && (
                        <p className="text-xs text-white/40 mt-1.5 line-clamp-2">{series.description}</p>
                      )}
                    </div>
                    {/* Article count pill */}
                    <div className="shrink-0 flex flex-col items-center bg-blue-500/10 border border-blue-500/20 rounded-2xl px-3 py-2 min-w-[52px]">
                      <span className="text-xl font-black text-blue-400 leading-none">{articleCount}</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-blue-400/60 mt-0.5">
                        {articleCount === 1 ? 'article' : 'articles'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--color-border)]">
                    {/* Manage articles */}
                    <Link
                      href={`/admin/series/${series.id}`}
                      className="flex-1 sm:flex-none text-center flex items-center justify-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                      Manage Articles
                    </Link>

                    {/* Publish / Unpublish */}
                    <form action={togglePublishAction} className="flex-1 sm:flex-none">
                      <input type="hidden" name="id"     value={series.id} />
                      <input type="hidden" name="status" value={series.status} />
                      <button
                        type="submit"
                        className={`w-full text-center px-4 py-2 rounded-xl border transition-colors text-xs font-bold uppercase tracking-wider ${
                          isPublished
                            ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/20'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                    </form>

                    {/* Delete */}
                    {['admin', 'super_admin'].includes(profile.role) && (
                      <form action={deleteSeriesAction} className="flex-1 sm:flex-none">
                        <input type="hidden" name="id" value={series.id} />
                        <button
                          type="submit"
                          className="w-full text-center px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors text-xs font-bold uppercase tracking-wider"
                          onClick={(e) => { if (!confirm(`Delete "${series.title}"?`)) e.preventDefault(); }}
                        >
                          Delete
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
