import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users, BarChart2, MessageSquare, Image as ImageIcon,
  Layers, ScrollText, Library, LucideIcon, ArrowRight,
  SlidersHorizontal, ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

interface CardItem {
  label: string;
  sub: string;
  href: string;
  icon: LucideIcon;
  color: string;       // text / icon colour
  bg: string;          // icon bg
  border: string;      // card border accent (hover)
  badge?: number;
}

const MANAGE_ITEMS: CardItem[] = [
  {
    label: 'Users',
    sub: 'Manage accounts & assign roles',
    href: '/admin/users',
    icon: Users,
    color: '#a78bfa',
    bg: 'rgba(124,58,237,0.15)',
    border: 'rgba(124,58,237,0.40)',
  },
  {
    label: 'Analytics',
    sub: 'Traffic, page views & growth',
    href: '/admin/analytics',
    icon: BarChart2,
    color: '#60a5fa',
    bg: 'rgba(37,99,235,0.15)',
    border: 'rgba(37,99,235,0.40)',
  },
  {
    label: 'Comments',
    sub: 'Moderation queue & approvals',
    href: '/admin/comments',
    icon: MessageSquare,
    color: '#34d399',
    bg: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.40)',
  },
  {
    label: 'Media',
    sub: 'File library & image uploads',
    href: '/admin/media',
    icon: ImageIcon,
    color: '#f472b6',
    bg: 'rgba(236,72,153,0.15)',
    border: 'rgba(236,72,153,0.40)',
  },
  {
    label: 'Categories',
    sub: 'Organise content by topics',
    href: '/admin/categories',
    icon: Library,
    color: '#fbbf24',
    bg: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.40)',
  },
  {
    label: 'Sequels',
    sub: 'Multi-part article collections',
    href: '/admin/sequels',
    icon: Layers,
    color: '#fb923c',
    bg: 'rgba(234,88,12,0.15)',
    border: 'rgba(234,88,12,0.40)',
  },
  {
    label: 'Audit Logs',
    sub: 'Full activity & change history',
    href: '/admin/audit-logs',
    icon: ScrollText,
    color: '#c084fc',
    bg: 'rgba(168,85,247,0.15)',
    border: 'rgba(168,85,247,0.40)',
  },
];

export default async function ManagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'super_admin') redirect('/admin?error=unauthorized');

  /* ── Optional live counts ── */
  let pendingComments = 0;
  try {
    const [{ count: cc }] = await Promise.all([
      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);
    pendingComments = cc ?? 0;
  } catch { /* non-fatal */ }

  const items: CardItem[] = MANAGE_ITEMS.map(i =>
    i.href === '/admin/comments' && pendingComments > 0
      ? { ...i, badge: pendingComments }
      : i
  );

  return (
    <div className="font-sans antialiased min-h-screen pb-28 px-4 pt-6 bg-[var(--color-background)]">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-8 mt-2">
          <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)] shrink-0 hidden sm:flex">
            <Link href="/admin">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
            <SlidersHorizontal className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-text)]">
              Manage
            </h1>
            <p className="text-sm text-[var(--color-muted)] font-medium mt-0.5">
              Daily oversight &amp; operations hub
            </p>
          </div>
        </div>

        {/* ── Grid of cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex items-center gap-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                // We use inline style for the dynamic hover border since Tailwind
                // cannot interpolate arbitrary colour values at runtime.
              }}
              onMouseEnter={undefined /* handled via Tailwind group hover below */}
            >
              {/* Hover border glow — rendered as a pseudo-element via box-shadow */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ boxShadow: `0 0 0 1.5px ${item.border}` }}
              />

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ background: item.bg }}
              >
                <item.icon size={22} style={{ color: item.color }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-black text-base text-[var(--color-text)] group-hover:text-white transition-colors"
                >
                  {item.label}
                  {item.badge ? (
                    <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-rose-500 text-white text-[9px] font-black px-1.5">
                      {item.badge}
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-[var(--color-muted)] font-medium mt-0.5 truncate">
                  {item.sub}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight
                size={16}
                className="flex-shrink-0 text-[var(--color-muted)] group-hover:translate-x-1 transition-transform duration-200"
                style={{ color: item.color, opacity: 0.6 }}
              />
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
