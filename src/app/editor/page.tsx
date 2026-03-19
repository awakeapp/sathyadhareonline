import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, ChevronRight, CheckCircle, Clock, Edit3 } from 'lucide-react';
import AdminContainer from '@/components/layout/AdminContainer';

export const dynamic = 'force-dynamic';

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draft',        color: '#94a3b8' },
  in_review: { label: 'In Review',    color: '#f59e0b' },
  published: { label: 'Published',    color: '#10b981' },
  archived:  { label: 'Archived',     color: '#8b5cf6' },
};

export default async function EditorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  let profile: { full_name: string | null; role: string } | null = null;
  let pageData = { totalCount: 0, publishedCount: 0, draftCount: 0, reviewCount: 0, recent: [] as any[] };

  try {
    const { data: p } = await supabase
      .from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
    profile = p as any;

    if (!profile || profile.role !== 'editor') redirect('/sign-in');

    const results = await Promise.allSettled([
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('author_id', user.id).eq('is_deleted', false),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('author_id', user.id).eq('status', 'published').eq('is_deleted', false),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('author_id', user.id).eq('status', 'draft').eq('is_deleted', false),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('author_id', user.id).eq('status', 'in_review').eq('is_deleted', false),
      supabase.from('articles').select('id, title, status, updated_at, slug').eq('author_id', user.id).eq('is_deleted', false).order('updated_at', { ascending: false }).limit(5),
    ]);

    const getVal = (idx: number) => (results[idx].status === 'fulfilled' ? (results[idx] as any).value : null);
    pageData = {
      totalCount:     getVal(0)?.count ?? 0,
      publishedCount: getVal(1)?.count ?? 0,
      draftCount:     getVal(2)?.count ?? 0,
      reviewCount:    getVal(3)?.count ?? 0,
      recent:         getVal(4)?.data || [],
    };
  } catch (err) {
    console.error('Editor dashboard fetch error:', err);
  }

  const { totalCount, publishedCount, draftCount, reviewCount, recent } = pageData;

  return (
    <AdminContainer className="flex flex-col gap-4 pt-1">
      {/* Stats row */}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total',     value: totalCount,     color: 'var(--color-primary)' },
          { label: 'Published', value: publishedCount, color: '#10b981' },
          { label: 'In Review', value: reviewCount,    color: '#f59e0b' },
        ].map(s => (
          <div
            key={s.label}
            className="flex flex-col items-center justify-center gap-0.5 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] py-4"
          >
            <span className="text-[24px] font-black text-[var(--color-text)] leading-none">{s.value}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.color }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Quick-write CTA */}
      <Link
        href="/editor/articles/write"
        className="flex items-center gap-3 p-4 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl hover:bg-[var(--color-primary)]/10 active:scale-[0.99] transition-all"
      >
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] min-w-[44px] min-h-[44px]">
          <Edit3 size={20} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-[var(--color-text)]">Write New Article</p>
          <p className="text-[12px] text-[var(--color-muted)]">Start a fresh draft now</p>
        </div>
        <ChevronRight size={16} className="text-[var(--color-muted)]" />
      </Link>

      {/* Recent activity */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold text-[var(--color-muted)] uppercase tracking-widest">Recent Activity</p>
          <Link href="/editor/articles" className="text-[12px] font-bold text-[var(--color-primary)] hover:underline underline-offset-4">
            See All
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
            <FileText size={28} className="text-[var(--color-muted)] opacity-40" />
            <p className="text-[14px] font-bold text-[var(--color-text)]">No articles yet</p>
            <p className="text-[12px] text-[var(--color-muted)]">Write your first article to get started.</p>
          </div>
        ) : (
          recent.map((a) => {
            const meta = STATUS_META[a.status ?? 'draft'] ?? STATUS_META.draft;
            return (
              <Link
                key={a.id}
                href={`/editor/articles/${a.id}/edit`}
                className="flex items-center gap-3 p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] active:scale-[0.99] transition-all"
              >
                <div
                  className="w-1.5 self-stretch rounded-full shrink-0"
                  style={{ background: meta.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[var(--color-text)] truncate leading-tight">{a.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</span>
                    <span className="text-[11px] text-[var(--color-muted)]">· {new Date(a.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
                <ChevronRight size={15} className="text-[var(--color-muted)] shrink-0" />
              </Link>
            );
          })
        )}
      </div>

    </AdminContainer>
  );
}
