import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DeleteArticleButton } from './DeleteArticleButton';

export const dynamic = 'force-dynamic';

export default async function ArticlesPage() {
  const supabase = await createClient();

  // ── Current user + role ──────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const canDelete =
    currentProfile?.role === 'admin' || currentProfile?.role === 'super_admin';

  // ── Fetch articles ───────────────────────────────────────────
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, status, is_deleted, is_featured')
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching articles:', error);

  // ── Server Actions ───────────────────────────────────────────

  async function publishArticleAction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;
    const supabaseAction = await createClient();
    await supabaseAction
      .from('articles')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', id);
    revalidatePath('/admin/articles');
    redirect('/admin/articles');
  }

  async function deleteArticleAction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;

    const supabaseAction = await createClient();

    // Re-verify role on every call — never trust the client
    const {
      data: { user: actionUser },
    } = await supabaseAction.auth.getUser();
    if (!actionUser) return;

    const { data: profile } = await supabaseAction
      .from('profiles')
      .select('role')
      .eq('id', actionUser.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) return;

    await supabaseAction
      .from('articles')
      .update({ is_deleted: true })
      .eq('id', id);

    revalidatePath('/admin/articles');
    revalidatePath('/');
    redirect('/admin/articles');
  }

  async function restoreArticleAction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;
    const supabaseAction = await createClient();
    await supabaseAction
      .from('articles')
      .update({ is_deleted: false })
      .eq('id', id);
    revalidatePath('/admin/articles');
    redirect('/admin/articles');
  }

  async function featureArticleAction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const current = formData.get('current') as string;
    if (!id) return;
    const supabaseAction = await createClient();

    if (current === 'true') {
      await supabaseAction
        .from('articles')
        .update({ is_featured: false })
        .eq('id', id);
    } else {
      await supabaseAction
        .from('articles')
        .update({ is_featured: false })
        .neq('id', id);
      await supabaseAction
        .from('articles')
        .update({ is_featured: true })
        .eq('id', id);
    }

    revalidatePath('/admin/articles');
    revalidatePath('/');
    redirect('/admin/articles');
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white safe-area-pb">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-white transition-colors active:scale-95">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">Articles</h1>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
                {articles?.length || 0} Total Articles
              </p>
            </div>
          </div>
          <Link
            href="/admin/articles/new"
            className="flex items-center gap-1.5 bg-[var(--color-primary)] text-black px-4 py-2.5 rounded-full text-sm font-bold hover:bg-[#ffed4a] transition-all shadow-lg shadow-[var(--color-primary)]/20 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">New</span>
          </Link>
        </div>

        {!articles || articles.length === 0 ? (
          <div className="py-20 text-center text-[var(--color-muted)] flex flex-col items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8">
            <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9" /></svg>
            <p className="font-semibold text-white mb-1">No articles found</p>
            <p className="text-sm">Create your first article to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className={`flex flex-col p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl shadow-lg relative overflow-hidden group transition-all ${
                  article.is_deleted ? 'opacity-60 grayscale-[50%]' : ''
                } ${
                  article.is_featured && !article.is_deleted ? 'border-[var(--color-primary)]/30 shadow-[var(--color-primary)]/5' : ''
                }`}
              >
                {/* Title & Status Badges */}
                <div className="mb-4">
                  <div className="flex items-start gap-2 mb-2">
                    {article.is_featured && (
                      <span title="Featured" className="text-[var(--color-primary)] text-lg mt-0.5">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      </span>
                    )}
                    <h3 className="font-bold text-white text-[16px] leading-tight flex-1">
                      {article.title}
                    </h3>
                  </div>
                  
                  <div className="flex gap-2 items-center flex-wrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        article.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}
                    >
                      {article.status}
                    </span>
                    {article.is_deleted && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                        Deleted
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Row */}
                <div className="pt-4 border-t border-[var(--color-border)] flex flex-wrap gap-2 justify-end">
                  
                  {/* Edit — always visible */}
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="flex-1 sm:flex-none text-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider"
                  >
                    Edit
                  </Link>

                  {/* Feature / Unfeature */}
                  {article.status === 'published' && !article.is_deleted && (
                    <form action={featureArticleAction} className="flex-1 sm:flex-none">
                      <input type="hidden" name="id" value={article.id} />
                      <input type="hidden" name="current" value={String(article.is_featured)} />
                      <button
                        type="submit"
                        className={`w-full text-center px-4 py-2 rounded-xl border transition-colors text-xs font-bold uppercase tracking-wider ${
                          article.is_featured
                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/20'
                            : 'bg-white/5 text-[var(--color-muted)] border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {article.is_featured ? 'Unfeature' : 'Feature'}
                      </button>
                    </form>
                  )}

                  {/* Publish (draft only) */}
                  {article.status === 'draft' && !article.is_deleted && (
                    <form action={publishArticleAction} className="flex-1 sm:flex-none">
                      <input type="hidden" name="id" value={article.id} />
                      <button
                        type="submit"
                        className="w-full text-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider"
                      >
                        Publish
                      </button>
                    </form>
                  )}

                  {/* Restore (deleted only) */}
                  {article.is_deleted && (
                    <form action={restoreArticleAction} className="flex-1 sm:flex-none">
                      <input type="hidden" name="id" value={article.id} />
                      <button
                        type="submit"
                        className="w-full text-center bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 px-4 py-2 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider"
                      >
                        Restore
                      </button>
                    </form>
                  )}

                  {/* Delete — admin / super_admin, non-deleted articles only */}
                  {canDelete && !article.is_deleted && (
                    <div className="flex-1 sm:flex-none">
                      <DeleteArticleButton
                        articleId={article.id}
                        articleTitle={article.title}
                        deleteAction={deleteArticleAction}
                      />
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
