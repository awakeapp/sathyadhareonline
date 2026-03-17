import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FileText, CheckCircle, Clock, PenLine } from 'lucide-react';

export const dynamic = 'force-dynamic';

/* ── Types ──────────────────────────────────────────────────────────── */
interface EditorRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  totalArticles:     number;
  publishedArticles: number;
  draftArticles:     number;
  inReviewArticles:  number;
}

export default async function AdminEditorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard/admin?denied=1');
  }

  /* ── Fetch all editors ──────────────────────────────────────────── */
  const { data: editors } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, email')
    .eq('role', 'editor')
    .eq('status', 'active')
    .order('full_name');

  /* ── Fetch article stats per editor ────────────────────────────── */
  const { data: articles } = await supabase
    .from('articles')
    .select('author_id, status')
    .eq('is_deleted', false)
    .in('author_id', (editors ?? []).map(e => e.id));

  /* ── Aggregate per editor ───────────────────────────────────────── */
  const statsMap = new Map<string, { total: number; published: number; draft: number; inReview: number }>();
  for (const a of articles ?? []) {
    const s = statsMap.get(a.author_id) ?? { total: 0, published: 0, draft: 0, inReview: 0 };
    s.total++;
    if (a.status === 'published') s.published++;
    else if (a.status === 'draft')     s.draft++;
    else if (a.status === 'in_review') s.inReview++;
    statsMap.set(a.author_id, s);
  }

  const rows: EditorRow[] = (editors ?? []).map(e => {
    const s = statsMap.get(e.id) ?? { total: 0, published: 0, draft: 0, inReview: 0 };
    return {
      id:                e.id,
      full_name:         e.full_name,
      avatar_url:        e.avatar_url,
      email:             e.email,
      totalArticles:     s.total,
      publishedArticles: s.published,
      draftArticles:     s.draft,
      inReviewArticles:  s.inReview,
    };
  });

  /* ── Sort by total articles descending (most active first) ─────── */
  rows.sort((a, b) => b.totalArticles - a.totalArticles);

  return (
    <div className="flex flex-col gap-3">
      {/* Page title */}
      <div className="pt-2 pb-1">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">Editors</h1>
        <p className="text-[13px] text-[var(--color-muted)] mt-0.5">
          {rows.length} active editor{rows.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Quick-action card: assign content */}
      <a
        href="/admin/articles"
        className="flex items-center gap-3 p-4 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl hover:bg-[var(--color-primary)]/10 active:scale-[0.99] transition-all"
      >
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
          <PenLine size={20} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-[var(--color-text)]">Assign Content</p>
          <p className="text-[12px] text-[var(--color-muted)]">Open Articles to assign to an editor</p>
        </div>
      </a>

      {/* Editor list */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)]">
            <PenLine size={26} strokeWidth={1.5} />
          </div>
          <p className="text-[15px] font-bold text-[var(--color-text)]">No editors yet</p>
          <p className="text-[13px] text-[var(--color-muted)]">When editors are added they will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map(editor => {
            const initials = (editor.full_name ?? editor.email ?? 'E').charAt(0).toUpperCase();

            return (
              <div
                key={editor.id}
                className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden"
              >
                {/* Editor identity row */}
                <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                  {editor.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editor.avatar_url}
                      alt={editor.full_name ?? 'Editor'}
                      className="w-10 h-10 rounded-full object-cover border border-[var(--color-border)] shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] font-bold text-[15px] shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-[var(--color-text)] truncate leading-tight">
                      {editor.full_name ?? 'Unnamed Editor'}
                    </p>
                    {editor.email && (
                      <p className="text-[12px] text-[var(--color-muted)] truncate mt-0.5">{editor.email}</p>
                    )}
                  </div>
                  {/* Total article badge */}
                  <div className="shrink-0 flex items-center gap-1 text-[var(--color-muted)]">
                    <FileText size={14} strokeWidth={1.75} />
                    <span className="text-[13px] font-bold">{editor.totalArticles}</span>
                  </div>
                </div>

                {/* Workload strip */}
                <div className="grid grid-cols-3 divide-x divide-[var(--color-border)] border-t border-[var(--color-border)]">
                  <StatCell
                    icon={<CheckCircle size={13} strokeWidth={2} />}
                    label="Published"
                    value={editor.publishedArticles}
                    color="#10b981"
                  />
                  <StatCell
                    icon={<Clock size={13} strokeWidth={2} />}
                    label="In Review"
                    value={editor.inReviewArticles}
                    color="#f59e0b"
                  />
                  <StatCell
                    icon={<FileText size={13} strokeWidth={2} />}
                    label="Drafts"
                    value={editor.draftArticles}
                    color="#8b5cf6"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Workload stat cell ──────────────────────────────────────────────── */
function StatCell({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 py-2.5">
      <span className="text-[18px] font-black text-[var(--color-text)] leading-none">{value}</span>
      <div className="flex items-center gap-1 mt-0.5" style={{ color }}>
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}
