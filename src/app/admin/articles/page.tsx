import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DeleteArticleButton } from './DeleteArticleButton';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, ChevronLeft, FileText, Sparkles, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

// ── Status metadata ──────────────────────────────────────────────
type ArticleStatus = 'draft' | 'in_review' | 'published' | 'archived';

const STATUS_META: Record<ArticleStatus, { label: string; color: string }> = {
  draft:      { label: 'Draft',      color: 'bg-gray-500/10 text-[var(--color-muted)] border-gray-500/20' },
  in_review:  { label: 'In Review',  color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  published:  { label: 'Published',  color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  archived:   { label: 'Archived',   color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
};

// Allowed role → transitions map
// Admins:     in_review → published | in_review → archived | published → archived
const TRANSITIONS: Record<string, { from: ArticleStatus[]; to: ArticleStatus; label: string; btnVariant: "primary" | "secondary" | "ghost" | "outline" | "destructive", customClass?: string }[]> = {
  admin: [
    { from: ['draft'], to: 'in_review', label: 'Submit for Review', btnVariant: 'outline', customClass: 'text-amber-500 hover:text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20' },
    { from: ['in_review'], to: 'published', label: 'Approve & Publish', btnVariant: 'outline', customClass: 'text-emerald-500 hover:text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20' },
    { from: ['in_review', 'published'], to: 'archived', label: 'Archive', btnVariant: 'outline', customClass: 'text-purple-500 hover:text-purple-500 bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20' },
    { from: ['archived'], to: 'draft', label: 'Unarchive (Draft)', btnVariant: 'outline' },
  ],
  super_admin: [
    { from: ['draft'], to: 'in_review', label: 'Submit for Review', btnVariant: 'outline', customClass: 'text-amber-500 hover:text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20' },
    { from: ['in_review'], to: 'published', label: 'Approve & Publish', btnVariant: 'outline', customClass: 'text-emerald-500 hover:text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20' },
    { from: ['in_review', 'published'], to: 'archived', label: 'Archive', btnVariant: 'outline', customClass: 'text-purple-500 hover:text-purple-500 bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20' },
    { from: ['archived'], to: 'draft', label: 'Unarchive (Draft)', btnVariant: 'outline' },
  ],
};

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

  const role = currentProfile?.role ?? 'reader';
  const canDelete = ['admin', 'super_admin'].includes(role);
  const allowedTransitions = TRANSITIONS[role] ?? [];

  // ── Fetch articles ───────────────────────────────────────────
  const articlesQuery = supabase
    .from('articles')
    .select('id, title, status, is_deleted, is_featured, author_id')
    .order('created_at', { ascending: false });

  const { data: articles, error } = await articlesQuery;

  if (error) console.error('Error fetching articles:', error);

  // ── Server Actions ───────────────────────────────────────────

  // Generic status transition — server-side role enforcement
  async function transitionStatusAction(formData: FormData) {
    'use server';
    const id        = formData.get('id') as string;
    const toStatus  = formData.get('to') as ArticleStatus;
    if (!id || !toStatus) return;

    const supabaseAction = await createClient();
    const { data: { user: actionUser } } = await supabaseAction.auth.getUser();
    if (!actionUser) return;

    // Re-verify role server-side — never trust formData
    const { data: profile } = await supabaseAction
      .from('profiles')
      .select('role')
      .eq('id', actionUser.id)
      .single();

    const actionRole = profile?.role ?? 'reader';
    const actionAllowed = TRANSITIONS[actionRole] ?? [];

    // Fetch current article status to validate the from→to transition
    const { data: article } = await supabaseAction
      .from('articles')
      .select('status')
      .eq('id', id)
      .single();

    if (!article) return;

    const currentStatus = article.status as ArticleStatus;
    const isValid = actionAllowed.some(
      (t) => t.to === toStatus && t.from.includes(currentStatus)
    );
    if (!isValid) return; // silently block unauthorised transition

    const updatePayload: Record<string, unknown> = { status: toStatus };
    if (toStatus === 'published') updatePayload.published_at = new Date().toISOString();

    await supabaseAction.from('articles').update(updatePayload).eq('id', id);

    revalidatePath('/admin/articles');
    revalidatePath('/');
    redirect('/admin/articles');
  }

  async function deleteArticleAction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;

    const supabaseAction = await createClient();
    const { data: { user: actionUser } } = await supabaseAction.auth.getUser();
    if (!actionUser) return;

    const { data: profile } = await supabaseAction
      .from('profiles')
      .select('role')
      .eq('id', actionUser.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) return;

    await supabaseAction.from('articles').update({ is_deleted: true }).eq('id', id);

    revalidatePath('/admin/articles');
    revalidatePath('/');
    redirect('/admin/articles');
  }

  async function restoreArticleAction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;
    const supabaseAction = await createClient();
    await supabaseAction.from('articles').update({ is_deleted: false }).eq('id', id);
    revalidatePath('/admin/articles');
    redirect('/admin/articles');
  }

  async function featureArticleAction(formData: FormData) {
    'use server';
    const id      = formData.get('id') as string;
    const current = formData.get('current') as string;
    if (!id) return;
    const supabaseAction = await createClient();

    if (current === 'true') {
      await supabaseAction.from('articles').update({ is_featured: false }).eq('id', id);
    } else {
      await supabaseAction.from('articles').update({ is_featured: false }).neq('id', id);
      await supabaseAction.from('articles').update({ is_featured: true }).eq('id', id);
    }

    revalidatePath('/admin/articles');
    revalidatePath('/');
    redirect('/admin/articles');
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="font-sans antialiased max-w-3xl mx-auto py-2">
      <div className="flex items-center justify-between mb-8 mt-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)]">
            <Link href="/admin">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-tight">
              Articles
            </h1>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
              {articles?.length || 0} Total · {role}
            </p>
          </div>
        </div>
        <Button asChild className="rounded-full shadow-sm pr-5">
          <Link href="/admin/articles/new">
            <Plus className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">New Article</span>
            <span className="sm:hidden">New</span>
          </Link>
        </Button>
      </div>

      {/* ── Workflow legend ─────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6 px-1">
        {(Object.entries(STATUS_META) as [ArticleStatus, { label: string; color: string }][]).map(([key, meta]) => (
          <span key={key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.color}`}>
            {meta.label}
          </span>
        ))}
      </div>

      {!articles || articles.length === 0 ? (
        <Card className="py-20 text-center flex flex-col items-center border-[var(--color-border)] border-dashed rounded-[2rem] shadow-none bg-[var(--color-surface)]">
          <FileText className="w-12 h-12 mb-4 opacity-20 text-[var(--color-muted)]" />
          <p className="font-bold mb-1 text-lg tracking-tight">No articles found</p>
          <p className="text-sm text-[var(--color-muted)]">Create your first article to get started!</p>
          <Button asChild className="mt-6 rounded-xl">
             <Link href="/admin/articles/new">Write Article</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => {
            const status = (article.status ?? 'draft') as ArticleStatus;
            const statusMeta = STATUS_META[status] ?? STATUS_META.draft;

            // Resolve which transition buttons this role can show for this article
            const availableTransitions = allowedTransitions.filter(
              (t) => t.from.includes(status) && !article.is_deleted
            );

            return (
              <Card
                key={article.id}
                className={`overflow-hidden transition-all duration-300 ${
                  article.is_deleted ? 'opacity-50 grayscale' : ''
                } ${
                  article.is_featured && !article.is_deleted ? 'border-[var(--color-primary)]/30 ring-1 ring-[var(--color-primary)]/30' : ''
                } ${
                  status === 'in_review' && !article.is_deleted ? 'border-amber-500/30' : ''
                }`}
              >
                <CardContent className="p-5">
                  {/* ── Title & badges ──────────────────────── */}
                  <div className="mb-5">
                    <div className="flex items-start gap-2.5 mb-2.5">
                      {article.is_featured && (
                        <span title="Featured" className="text-[var(--color-primary)] mt-0.5">
                          <Sparkles className="w-5 h-5 fill-current" />
                        </span>
                      )}
                      <h3 className="font-bold text-lg leading-tight tracking-tight flex-1">{article.title}</h3>
                    </div>

                    <div className="flex gap-2 items-center flex-wrap mt-2">
                      {/* Status badge */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                      {article.is_deleted && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                          <AlertCircle className="w-3 h-3 mr-1" /> Deleted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Actions ─────────────────────────────── */}
                  <div className="pt-4 border-t border-[var(--color-border)] flex flex-wrap gap-2 justify-end">

                    {/* Edit — always visible (non-deleted) */}
                    {!article.is_deleted && (
                      <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none text-blue-500 hover:text-blue-500 hover:bg-blue-500/10 border-blue-500/20 bg-blue-500/5">
                        <Link href={`/admin/articles/${article.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                    )}

                    {/* ── Workflow transition buttons ──────── */}
                    {availableTransitions.map((t) => (
                      <form key={t.to} action={transitionStatusAction} className="flex-1 sm:flex-none">
                        <input type="hidden" name="id"  value={article.id} />
                        <input type="hidden" name="to"  value={t.to} />
                        <Button
                          type="submit"
                          variant={t.btnVariant}
                          size="sm"
                          className={`w-full ${t.customClass || ''}`}
                        >
                          {t.label}
                        </Button>
                      </form>
                    ))}

                    {/* Feature / Unfeature — published only */}
                    {status === 'published' && !article.is_deleted && (
                      <form action={featureArticleAction} className="flex-1 sm:flex-none">
                        <input type="hidden" name="id"      value={article.id} />
                        <input type="hidden" name="current" value={String(article.is_featured)} />
                        <Button
                          type="submit"
                          size="sm"
                          variant={article.is_featured ? 'primary' : 'outline'}
                          className={`w-full ${article.is_featured ? 'shadow-sm shadow-[var(--color-primary)]/20 text-black' : ''}`}
                        >
                          {article.is_featured ? 'Unfeature' : 'Feature'}
                        </Button>
                      </form>
                    )}

                    {/* Restore — soft-deleted only */}
                    {article.is_deleted && (
                      <form action={restoreArticleAction} className="flex-1 sm:flex-none">
                        <input type="hidden" name="id" value={article.id} />
                        <Button type="submit" variant="outline" size="sm" className="w-full text-sky-500 hover:text-sky-500 bg-sky-500/5 hover:bg-sky-500/10 border-sky-500/20">
                          Restore
                        </Button>
                      </form>
                    )}

                    {/* Delete — admin/super_admin only, non-deleted only */}
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
