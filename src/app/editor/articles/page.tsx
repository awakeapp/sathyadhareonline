import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Plus, Eye, Edit2, FileText, BarChart2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Status badge metadata
const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Draft',     cls: 'bg-gray-500/10 text-[var(--color-muted)] border-gray-500/20' },
  in_review: { label: 'In Review', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  published: { label: 'Published', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  archived:  { label: 'Archived',  cls: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
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
    <div className="font-sans antialiased max-w-3xl mx-auto py-2">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8 mt-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)]">
            <Link href="/editor">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-tight">My Articles</h1>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
              {articles?.length ?? 0} article{articles?.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button asChild className="rounded-full shadow-sm pr-5">
          <Link href="/editor/articles/new">
            <Plus className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">New Article</span>
            <span className="sm:hidden">New</span>
          </Link>
        </Button>
      </div>

      {/* ── Workflow legend ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6 px-1">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <span key={key} className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.cls}`}>
            {meta.label}
          </span>
        ))}
      </div>

      {/* ── Article list ─────────────────────────────────────────── */}
      {!articles || articles.length === 0 ? (
        <Card className="py-20 text-center flex flex-col items-center bg-[var(--color-surface)] border-[var(--color-border)] border-dashed rounded-[2rem] shadow-none">
          <FileText className="w-12 h-12 mb-4 opacity-20 text-[var(--color-muted)]" />
          <p className="font-bold mb-1 text-lg tracking-tight">No articles yet</p>
          <p className="text-sm text-[var(--color-muted)]">Create your first article to get started.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {articles.map(article => {
            const status = article.status ?? 'draft';
            const meta   = STATUS_META[status] ?? STATUS_META.draft;
            const views  = viewCounts[article.id] ?? 0;

            return (
              <Card key={article.id} hoverable className="rounded-3xl border-transparent bg-[var(--color-surface)] shadow-none flex p-1 items-stretch">
                {/* Status indicator bar */}
                <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 my-3 ml-3 ${
                  status === 'published' ? 'bg-emerald-500' :
                  status === 'in_review' ? 'bg-amber-500' :
                  status === 'archived'  ? 'bg-purple-500' :
                  'bg-[var(--color-muted)]/20'
                }`} />

                <CardContent className="flex-1 p-5 pl-4 flex flex-col sm:flex-row gap-4 sm:items-center min-w-0">
                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-lg leading-tight tracking-tight">{article.title}</h3>
                      <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border mt-0.5 ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>

                    {/* Meta row: updated + views */}
                    <div className="flex items-center gap-2 text-[12px] text-[var(--color-muted)] font-semibold mt-1">
                      <span>
                        Updated {new Date(article.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="w-1 h-1 bg-[var(--color-border)] rounded-full hidden sm:block" />
                      <span className="flex items-center gap-1.5 bg-[var(--color-surface-2)] px-2 py-0.5 rounded-md">
                        <BarChart2 className="w-3.5 h-3.5" />
                        {views.toLocaleString()} view{views !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* View in reader (only if published or has slug) */}
                    {article.slug && status === 'published' && (
                      <Button asChild variant="outline" size="sm" className="hidden sm:flex text-[var(--color-muted)] hover:text-[var(--color-text)] bg-transparent border-[var(--color-border)]">
                        <Link href={`/articles/${article.slug}`} target="_blank">
                          <Eye className="w-4 h-4 sm:mr-1.5" />
                          <span className="hidden sm:inline">View</span>
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-blue-500 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:text-blue-500">
                      <Link href={`/editor/articles/${article.id}/edit`}>
                        <Edit2 className="w-4 h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </Link>
                    </Button>
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
