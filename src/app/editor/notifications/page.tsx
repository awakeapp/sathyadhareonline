import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Bell, CheckCircle, FileText, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

function relTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const EVENT_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  assigned:   { label: 'Assigned',    color: '#685de6', icon: FileText     },
  approved:   { label: 'Approved',    color: '#10b981', icon: CheckCircle  },
  rejected:   { label: 'Needs Work',  color: '#ef4444', icon: AlertCircle  },
  feedback:   { label: 'Feedback',    color: '#f59e0b', icon: Bell         },
};

export default async function EditorNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle();

  if (!profile || profile.role !== 'editor') redirect('/sign-in');

  /* ── Fetch recent in-review articles as proxy for notifications ─
     Real notification system can replace this when ready.           */
  const { data: recentArticles } = await supabase
    .from('articles')
    .select('id, title, status, updated_at')
    .eq('author_id', user.id)
    .eq('is_deleted', false)
    .in('status', ['in_review', 'published', 'draft'])
    .order('updated_at', { ascending: false })
    .limit(20);

  /* ── Build synthetic notification events from article statuses ───── */
  interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
  }

  const notifications: Notification[] = (recentArticles ?? []).map(a => {
    if (a.status === 'published') {
      return { id: a.id, type: 'approved', title: a.title, message: 'Your article was approved and published.', time: a.updated_at };
    }
    if (a.status === 'in_review') {
      return { id: a.id, type: 'assigned', title: a.title, message: 'Your article is being reviewed by an admin.', time: a.updated_at };
    }
    return { id: a.id, type: 'feedback', title: a.title, message: 'New activity on your draft.', time: a.updated_at };
  });

  return (
    <div className="flex flex-col gap-3">

      {/* Page title */}
      <div className="pt-2 pb-1">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">Updates</h1>
        <p className="text-[13px] text-[var(--color-muted)] mt-0.5">Assignments and feedback from admin</p>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)]">
            <Bell size={26} strokeWidth={1.5} />
          </div>
          <p className="text-[15px] font-bold text-[var(--color-text)]">No updates yet</p>
          <p className="text-[13px] text-[var(--color-muted)]">
            When an admin assigns content or gives feedback, you&apos;ll see it here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map(n => {
            const meta = EVENT_META[n.type] ?? EVENT_META.feedback;
            const Icon = meta.icon;

            return (
              <div
                key={n.id}
                className="flex items-start gap-3 p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]"
              >
                <div
                  className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
                  style={{ background: `${meta.color}14`, color: meta.color }}
                >
                  <Icon size={18} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[var(--color-text)] truncate leading-tight">{n.title}</p>
                  <p className="text-[12px] text-[var(--color-muted)] mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                      style={{ background: `${meta.color}14`, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-[var(--color-muted)]">{relTime(n.time)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
