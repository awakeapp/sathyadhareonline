import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Eye, FileText, BarChart2, SquarePen } from 'lucide-react';
import AdminContainer from '@/components/layout/AdminContainer';

export const dynamic = 'force-dynamic';

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draft',        color: '#94a3b8' },
  in_review: { label: 'In Review',    color: '#f59e0b' },
  published: { label: 'Published',    color: '#10b981' },
  archived:  { label: 'Archived',     color: '#8b5cf6' },
};

export default async function EditorArticlesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();

  if (!profile || profile.role !== 'editor') redirect('/sign-in');

  // Only fetch articles assigned to this editor
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, status, slug, updated_at, created_at, assignment_notes, assigned_at')
    .eq('assigned_to', user.id)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false });

  if (error) console.error('Error fetching articles:', error);

  // View counts
  const articleIds = (articles ?? []).map(a => a.id);
  const viewCounts: Record<string, number> = {};
  if (articleIds.length > 0) {
    const { data: viewRows } = await supabase
      .from('article_views').select('article_id').in('article_id', articleIds);
    for (const row of viewRows ?? []) {
      viewCounts[row.article_id] = (viewCounts[row.article_id] ?? 0) + 1;
    }
  }

  return (
    <AdminContainer className="flex flex-col gap-4">

      {/* Page heading */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">My Assignments</h1>
          <p className="text-[13px] text-[var(--color-muted)] mt-0.5">
            You have {articles?.length ?? 0} assigned article{(articles?.length ?? 0) !== 1 ? 's' : ''} to review and format
          </p>
        </div>
        <Link
          href="/editor/articles/new"
          className="flex items-center gap-1.5 px-3 h-9 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors text-[var(--color-text)] active:scale-95 font-bold text-[12px]"
        >
          <SquarePen size={14} strokeWidth={2} />
          Write
        </Link>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
            <span className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-wide">{meta.label}</span>
          </div>
        ))}
      </div>

      {/* Article list */}
      {!articles || articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 bg-[var(--color-surface)] rounded-xl border border-dashed border-[var(--color-border)]">
          <FileText size={32} className="text-[var(--color-muted)] opacity-30" />
          <p className="text-[15px] font-bold text-[var(--color-text)]">No articles yet</p>
          <p className="text-[13px] text-[var(--color-muted)]">When the admin assigns you content it will appear here.</p>
          <Link
            href="/editor/articles/new"
            className="mt-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-[12px] font-bold uppercase tracking-wider active:scale-95 transition-all"
          >
            Write First Article
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {articles.map(article => {
            const status = article.status ?? 'draft';
            const meta   = STATUS_META[status] || STATUS_META.draft;
            const views  = viewCounts[article.id] ?? 0;
            const isEditable = ['draft', 'in_review'].includes(status);

            return (
              <div
                key={article.id}
                className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden"
              >
                <div className="flex items-stretch">
                  {/* Status strip */}
                  <div className="w-1 shrink-0" style={{ backgroundColor: meta.color }} />

                  <div className="flex-1 flex items-center gap-3 px-4 py-4">
                    {/* Text */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <p className="text-[14px] font-bold text-[var(--color-text)] leading-snug">
                        {article.title}
                      </p>
                      {article.assignment_notes && (
                        <p className="text-[12px] font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-100 dark:border-amber-500/20">
                          <span className="font-bold mr-1">Admin Notes:</span> {article.assignment_notes}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-[var(--color-surface-2)] px-2 py-0.5 rounded-md" style={{ color: meta.color }}>
                          {meta.label}
                        </span>
                        <span className="text-[11px] font-bold text-[var(--color-muted)]">
                          Assigned: {article.assigned_at ? new Date(article.assigned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(article.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {status === 'published' && article.slug && (
                        <Link
                          href={`/articles/${article.slug}`}
                          target="_blank"
                          className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                          title="View published article"
                        >
                          <Eye size={16} strokeWidth={2} />
                        </Link>
                      )}
                      {isEditable && (
                        <Link
                          href={`/editor/articles/${article.id}/edit`}
                          className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors text-[12px] font-bold"
                        >
                          <SquarePen size={13} strokeWidth={2} />
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminContainer>
  );
}
