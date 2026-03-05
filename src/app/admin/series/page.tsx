import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Label } from '@/components/ui/Input';
import { ChevronLeft, FolderOpen, Settings, Eye, EyeOff, Trash2, Plus } from 'lucide-react';

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

  /* Note: togglePublishAction and deleteSeriesAction could be client components 
     to avoid full page reload on button click or prevent window.confirm server issues.
     But we're just updating the UI for now. */
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
    <div className="font-sans antialiased max-w-3xl mx-auto py-2">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8 mt-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)]">
            <Link href="/admin">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-tight">Series</h1>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
              {seriesList?.length ?? 0} collections
            </p>
          </div>
        </div>
      </div>

      {/* ── Create Form ─────────────────────────────────────── */}
      <Card className="mb-10 rounded-[2rem] border-[var(--color-border)] overflow-hidden shadow-lg shadow-black/5">
        <div className="bg-[var(--color-surface)] p-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
               <Plus className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">New Series</h2>
              <p className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">Create a new collection</p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <form action={createSeriesAction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input required name="title" type="text" placeholder="Series title" />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input required name="slug" type="text" placeholder="series-slug" className="font-mono text-sm" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea name="description" rows={2} placeholder="Brief description of this series…" className="resize-none" />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" className="shadow-sm text-black">
                <Plus className="w-4 h-4 mr-1.5" />
                Create Series
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Series List ─────────────────────────────────────── */}
      {!seriesList || seriesList.length === 0 ? (
        <Card className="py-20 text-center flex flex-col items-center bg-[var(--color-surface)] border-[var(--color-border)] border-dashed rounded-[2rem] shadow-none">
          <FolderOpen className="w-12 h-12 mb-4 opacity-20 text-[var(--color-muted)]" />
          <p className="font-bold mb-1 text-lg tracking-tight">No series yet</p>
          <p className="text-sm text-[var(--color-muted)]">Create your first series above</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {seriesList.map((series) => {
            const articleCount = (series.sequel_articles as unknown as { count: number }[])?.[0]?.count ?? 0;
            const isPublished  = series.status === 'published';

            return (
              <Card
                key={series.id}
                hoverable
                className={`rounded-[2rem] shadow-none transition-all ${
                  isPublished
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-transparent bg-[var(--color-surface)]'
                }`}
              >
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1.5">
                        <h3 className="font-bold text-lg leading-tight tracking-tight truncate">{series.title}</h3>
                        <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border mt-0.5 ${
                          isPublished
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-gray-500/10 text-[var(--color-muted)] border-gray-500/20'
                        }`}>
                          {series.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[var(--color-muted)] bg-[var(--color-surface-2)] inline-block px-2 py-0.5 rounded-md mt-1 mb-2">/{series.slug}</p>
                      {series.description && (
                        <p className="text-[13px] text-[var(--color-muted)] mt-1.5 line-clamp-2 font-medium leading-relaxed">{series.description}</p>
                      )}
                    </div>

                    {/* Article count pill */}
                    <div className="shrink-0 flex flex-col items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-2xl w-14 h-14">
                      <span className="text-xl font-black text-blue-500 leading-none">{articleCount}</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-blue-500/60 mt-0.5">
                        {articleCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--color-border)]">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none text-blue-500 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:text-blue-500"
                    >
                      <Link href={`/admin/series/${series.id}`}>
                        <Settings className="w-3.5 h-3.5 mr-1.5" />
                        Manage
                      </Link>
                    </Button>

                    <form action={togglePublishAction} className="flex-1 sm:flex-none flex">
                      <input type="hidden" name="id" value={series.id} />
                      <input type="hidden" name="status" value={series.status} />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className={`w-full ${
                          isPublished
                            ? 'text-amber-500 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:text-amber-500'
                            : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-500'
                        }`}
                      >
                        {isPublished ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
                        {isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                    </form>

                    {['admin', 'super_admin'].includes(profile.role) && (
                      <form action={deleteSeriesAction} className="flex-1 sm:flex-none flex">
                        <input type="hidden" name="id" value={series.id} />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="w-full text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:text-red-500"
                          /* Note: Since this is purely a server action inside a form button, 
                             adding onClick to prevent default is flaky and depends on React. 
                             Ideally a client component handles delete confirmation via Radix Modal. */
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Delete
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
