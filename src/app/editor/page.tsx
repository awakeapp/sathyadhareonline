import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SquarePen, FileText, ChevronRight, Eye } from 'lucide-react';

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
    draft:     { label: 'Draft',      cls: 'bg-gray-500/10 text-[var(--color-muted)] border-gray-500/20' },
    in_review: { label: 'In Review',  cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    published: { label: 'Published',  cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    archived:  { label: 'Archived',   cls: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  };

  const stats = [
    { label: 'Total Articles', value: totalCount ?? 0, color: '#8b5cf6' },
    { label: 'Published',      value: publishedCount ?? 0, color: '#10b981' },
    { label: 'In Review',      value: reviewCount ?? 0, color: '#f59e0b' },
    { label: 'Drafts',         value: draftCount ?? 0, color: '#6b7280' },
  ];

  return (
    <div className="font-sans antialiased max-w-5xl mx-auto py-2">

      {/* ── Profile header ────────────────────────────────────── */}
      <header className="mb-10 mt-4">
        <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">Editor Workspace</p>
        <h1 className="text-2xl font-black tracking-tight mt-1 truncate">
          Welcome back, {name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1 font-semibold">Here&apos;s your content overview for today.</p>
      </header>

      {/* ── Stats row ──────────────────────────────────────── */}
      <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-4">Your Progress</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {stats.map((s) => (
          <Card key={s.label} hoverable className="rounded-[1.5rem]">
            <CardContent className="p-5 flex flex-col gap-1 items-center justify-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">{s.label}</span>
              <span className="text-[28px] font-black tracking-tight" style={{ color: s.color }}>{s.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Quick Actions ────────────────────────────────────────── */}
      <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        <Link href="/editor/articles/new" className="group outline-none">
          <Card hoverable className="h-full rounded-[1.5rem] bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-2)] transition-colors border-transparent">
            <CardContent className="p-5 flex items-center gap-4 h-full">
              <div className="w-12 h-12 rounded-2xl bg-violet-600 border border-violet-500/20 flex items-center justify-center text-white shadow-lg shadow-violet-600/20 group-hover:scale-105 transition-transform">
                <SquarePen className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[var(--color-text)] truncate">Write New Article</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5 truncate">Start a fresh draft</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--color-muted)] opacity-50 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/editor/articles" className="group outline-none">
          <Card hoverable className="h-full rounded-[1.5rem] bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-2)] transition-colors border-transparent">
            <CardContent className="p-5 flex items-center gap-4 h-full">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-primary)] shadow-sm group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[var(--color-text)] truncate">My Articles</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5 truncate">Manage your {totalCount ?? 0} post{totalCount !== 1 ? 's' : ''}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--color-muted)] opacity-50 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Recent articles ──────────────────────────────────────── */}
      <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-4">Recent Activity</h2>
      <Card hoverable className="rounded-3xl overflow-hidden mb-10 border-[var(--color-border)]">
        {!recent || recent.length === 0 ? (
          <div className="py-14 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-20 text-[var(--color-muted)]" />
            <p className="text-sm font-bold text-[var(--color-muted)]">No articles yet</p>
            <p className="text-xs mt-1 text-[var(--color-muted)] opacity-70">Write your first article to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {recent.map(a => {
              const meta = statusMeta[a.status] ?? statusMeta.draft;
              return (
                <div key={a.id} className="flex items-center px-5 py-4 gap-3 hover:bg-[var(--color-surface)] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors">{a.title}</p>
                    <p className="text-[11px] font-semibold text-[var(--color-muted)] mt-1">
                      Updated {new Date(a.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${meta.cls}`}>
                    {meta.label}
                  </span>
                  <Button asChild variant="outline" size="sm" className="hidden sm:flex rounded-full text-xs font-bold ml-2">
                    <Link href={`/editor/articles/${a.id}/edit`}>
                      Edit
                    </Link>
                  </Button>
                  <Link href={`/editor/articles/${a.id}/edit`} className="sm:hidden p-2 text-[var(--color-primary)] ml-2 bg-[var(--color-primary)]/10 rounded-full">
                     <SquarePen className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Site link ─────────────────────────────────────────── */}
      <div className="flex justify-center pb-8 border-t border-[var(--color-border)] pt-8">
        <Button asChild variant="secondary" className="rounded-full shadow-sm pr-7 pl-6">
          <Link href="/">
            <Eye className="w-4 h-4 mr-2" />
            View Reader Site
          </Link>
        </Button>
      </div>

    </div>
  );
}
