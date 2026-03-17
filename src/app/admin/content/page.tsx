import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Layers,
  BookOpen,
  Mail,
  Tags,
  ChevronRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

/* ── Content sections the admin can manage ─────────────────────────── */
const SECTIONS = [
  {
    href:    '/admin/articles',
    label:   'Articles',
    sub:     'Intake, assign editors, publish',
    icon:    FileText,
    color:   '#685de6',
  },
  {
    href:    '/admin/sequels',
    label:   'Sequels',
    sub:     'Plan and manage sequel issues',
    icon:    Layers,
    color:   '#0ea5e9',
  },
  {
    href:    '/admin/library',
    label:   'Library',
    sub:     'Manage books and chapters',
    icon:    BookOpen,
    color:   '#10b981',
  },
  {
    href:    '/admin/friday',
    label:   'Friday Messages',
    sub:     'Poster CRUD for weekly messages',
    icon:    Mail,
    color:   '#f59e0b',
  },
  {
    href:    '/admin/categories',
    label:   'Categories',
    sub:     'Create, edit, delete categories',
    icon:    Tags,
    color:   '#8b5cf6',
  },
] as const;

export default async function AdminContentPage() {
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

  /* ── Lightweight counts for each section ───────────────────────── */
  const [articleRes, sequelRes, bookRes, fridayRes, catRes] = await Promise.allSettled([
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase.from('sequels').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase.from('books').select('*', { count: 'exact', head: true }),
    supabase.from('friday_messages').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
  ]);

  const counts = [
    articleRes.status === 'fulfilled' ? (articleRes.value.count ?? null) : null,
    sequelRes.status  === 'fulfilled' ? (sequelRes.value.count  ?? null) : null,
    bookRes.status    === 'fulfilled' ? (bookRes.value.count    ?? null) : null,
    fridayRes.status  === 'fulfilled' ? (fridayRes.value.count  ?? null) : null,
    catRes.status     === 'fulfilled' ? (catRes.value.count     ?? null) : null,
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Page title */}
      <div className="pt-2 pb-1">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">Content</h1>
        <p className="text-[13px] text-[var(--color-muted)] mt-0.5">Manage all content across the platform</p>
      </div>

      {/* Section cards */}
      <div className="flex flex-col gap-2">
        {SECTIONS.map((s, i) => {
          const Icon  = s.icon;
          const count = counts[i];

          return (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-4 p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] active:scale-[0.99] transition-all"
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${s.color}14`, color: s.color }}
              >
                <Icon size={22} strokeWidth={1.75} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-[var(--color-text)] leading-tight">{s.label}</p>
                <p className="text-[12px] text-[var(--color-muted)] mt-0.5 truncate">{s.sub}</p>
              </div>

              {/* Count badge */}
              <div className="flex items-center gap-2 shrink-0">
                {count !== null && (
                  <span className="text-[12px] font-bold text-[var(--color-muted)]">{count}</span>
                )}
                <ChevronRight size={16} className="text-[var(--color-muted)]" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
