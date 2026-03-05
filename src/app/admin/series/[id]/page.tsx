import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import ArticleReorder from './ArticleReorder';

export const dynamic = 'force-dynamic';

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // ── Auth ─────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // ── Fetch series ─────────────────────────────────────────────
  const { data: series, error: seriesError } = await supabase
    .from('sequels')
    .select('id, title, slug, description, status')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (seriesError || !series) notFound();

  // ── Fetch all non-deleted articles ───────────────────────────
  const { data: allArticles } = await supabase
    .from('articles')
    .select('id, title, status, published_at')
    .eq('is_deleted', false)
    .in('status', ['published', 'draft', 'in_review'])
    .order('published_at', { ascending: false, nullsFirst: false });

  // ── Fetch currently attached articles (ordered) ──────────────
  const { data: attached } = await supabase
    .from('sequel_articles')
    .select('article_id, order_index')
    .eq('sequel_id', id)
    .order('order_index', { ascending: true });

  // Capture slug for use in server action closures (TypeScript narrowing)
  const seriesSlug = series!.slug;

  // ── Server Action: Save article order ────────────────────────
  async function saveArticlesAction(formData: FormData) {
    'use server';
    const orderedIds = formData.getAll('article_ids') as string[];

    const supabaseAction = await createClient();
    const { data: { user: actionUser } } = await supabaseAction.auth.getUser();
    if (!actionUser) return;

    // Delete all existing entries for this series
    await supabaseAction.from('sequel_articles').delete().eq('sequel_id', id);

    // Re-insert with new positions
    if (orderedIds.length > 0) {
      const rows = orderedIds.map((articleId, index) => ({
        sequel_id:   id,
        article_id:  articleId,
        order_index: index,
      }));

      const { error } = await supabaseAction.from('sequel_articles').insert(rows);
      if (error) { console.error('Insert error:', error); return; }
    }

    revalidatePath('/admin/series');
    revalidatePath(`/admin/series/${id}`);
    revalidatePath(`/series/${seriesSlug}`);
    redirect('/admin/series');
  }

  // ── Server Action: Update series metadata ────────────────────
  async function updateSeriesAction(formData: FormData) {
    'use server';
    const title       = (formData.get('title') as string)?.trim();
    const slug        = (formData.get('slug') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();
    if (!title || !slug) return;

    const supabaseAction = await createClient();
    await supabaseAction
      .from('sequels')
      .update({ title, slug, description: description || null })
      .eq('id', id);

    revalidatePath('/admin/series');
    revalidatePath(`/admin/series/${id}`);
    redirect(`/admin/series/${id}`);
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white safe-area-pb">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/series"
            className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-white transition-colors active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight leading-tight truncate">{series.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                series.status === 'published'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
              }`}>
                {series.status}
              </span>
              <span className="text-xs font-mono text-[var(--color-muted)]">/{series.slug}</span>
            </div>
          </div>
        </div>

        {/* ── Edit Metadata ───────────────────────────────────── */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-5">Series Details</h2>
          <form action={updateSeriesAction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Title</label>
                <input
                  required name="title" type="text"
                  defaultValue={series.title}
                  className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Slug</label>
                <input
                  required name="slug" type="text"
                  defaultValue={series.slug}
                  className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                name="description" rows={2}
                defaultValue={series.description ?? ''}
                className="w-full px-4 py-3 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none transition-all resize-none text-sm"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-sm font-bold transition-all active:scale-95">
                Save Details
              </button>
            </div>
          </form>
        </div>

        {/* ── Article Manager ─────────────────────────────────── */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Article Order</h2>
            <p className="text-[10px] text-white/25">Drag or use arrows to reorder · click + to add</p>
          </div>

          <ArticleReorder
            allArticles={allArticles ?? []}
            attached={attached ?? []}
            seriesId={id}
            seriesTitle={series.title}
            saveAction={saveArticlesAction}
          />
        </div>

      </div>
    </div>
  );
}
