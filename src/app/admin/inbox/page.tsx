import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Send, Bell, FileText, Layers, BookOpen, ChevronRight, Inbox } from 'lucide-react';

export const dynamic = 'force-dynamic';

/* ── Submission type labels ──────────────────────────────────────────── */
const TYPE_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  article: { label: 'Article',      color: '#685de6', icon: FileText },
  sequel:  { label: 'Sequel',       color: '#0ea5e9', icon: Layers   },
  book:    { label: 'Book',         color: '#10b981', icon: BookOpen  },
  guest:   { label: 'Guest Writer', color: '#f59e0b', icon: Send      },
};

function typeHref(type: string, id: string): string {
  if (type === 'article') return `/admin/articles`;
  if (type === 'sequel')  return `/admin/sequels`;
  if (type === 'book')    return `/admin/library`;
  if (type === 'guest')   return `/admin/submissions`;
  return '/admin/submissions';
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)    return 'just now';
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default async function AdminInboxPage() {
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

  /* ── Fetch in-review staff submissions ──────────────────────────── */
  const [articleRes, sequelRes, bookRes, guestRes] = await Promise.allSettled([
    supabase
      .from('articles')
      .select('id, title, created_at, author:profiles!author_id(full_name)')
      .eq('status', 'in_review')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(20),

    supabase
      .from('sequels')
      .select('id, title, created_at')
      .eq('status', 'in_review')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('books')
      .select('id, title, created_at')
      .eq('status', 'in_review')
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('guest_submissions')
      .select('id, title, name, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  interface InboxItem {
    id: string;
    title: string;
    type: string;
    author: string;
    created_at: string;
  }

  const items: InboxItem[] = [
    ...(articleRes.status === 'fulfilled' ? (articleRes.value.data ?? []) : []).map((a: any) => ({
      id: a.id, title: a.title, type: 'article',
      author: (Array.isArray(a.author) ? a.author[0]?.full_name : a.author?.full_name) || 'Unknown',
      created_at: a.created_at,
    })),
    ...(sequelRes.status === 'fulfilled' ? (sequelRes.value.data ?? []) : []).map((s: any) => ({
      id: s.id, title: s.title, type: 'sequel', author: 'Admin', created_at: s.created_at,
    })),
    ...(bookRes.status === 'fulfilled' ? (bookRes.value.data ?? []) : []).map((b: any) => ({
      id: b.id, title: b.title, type: 'book', author: 'Admin', created_at: b.created_at,
    })),
    ...(guestRes.status === 'fulfilled' ? (guestRes.value.data ?? []) : []).map((g: any) => ({
      id: g.id, title: g.title || 'Untitled Submission', type: 'guest',
      author: g.name || 'Anonymous', created_at: g.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="flex flex-col gap-3 pt-1">
      {/* Notification banner from super admin */}

      {/* Notification banner from super admin */}
      <div className="flex items-start gap-3 p-4 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/15 rounded-xl">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] shrink-0">
          <Bell size={18} strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-[var(--color-text)] leading-tight">Super Admin Notifications</p>
          <p className="text-[12px] text-[var(--color-muted)] mt-0.5">
            Platform-level alerts from the Super Admin will appear here.
          </p>
        </div>
      </div>

      {/* Submission items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)]">
            <Inbox size={26} strokeWidth={1.5} />
          </div>
          <p className="text-[15px] font-bold text-[var(--color-text)]">Inbox is empty</p>
          <p className="text-[13px] text-[var(--color-muted)]">No submissions are pending review right now.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold text-[var(--color-muted)] uppercase tracking-widest">
              Pending Review
            </p>
            <Link
              href="/admin/submissions"
              className="text-[12px] font-bold text-[var(--color-primary)] hover:underline underline-offset-4"
            >
              View All
            </Link>
          </div>

          {items.map(item => {
            const meta = TYPE_META[item.type] ?? TYPE_META.article;
            const Icon = meta.icon;
            const href = typeHref(item.type, item.id);

            return (
              <Link
                key={`${item.type}-${item.id}`}
                href={href}
                className="flex items-center gap-3 p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] active:scale-[0.99] transition-all"
              >
                {/* Type icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${meta.color}14`, color: meta.color }}
                >
                  <Icon size={18} strokeWidth={1.75} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[var(--color-text)] truncate leading-tight">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                      style={{ background: `${meta.color}14`, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-[var(--color-muted)] truncate">
                      {item.author} · {relativeTime(item.created_at)}
                    </span>
                  </div>
                </div>

                <ChevronRight size={16} className="text-[var(--color-muted)] shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
