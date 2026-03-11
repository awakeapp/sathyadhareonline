import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users, BarChart2, MessageSquare, Image as ImageIcon,
  Layers, ScrollText, Library, LucideIcon,
  SlidersHorizontal, ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

interface CardItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

// Using a unified color scheme for that minimal, standard look
const UNIFIED_COLOR = '#4f46e5'; // Indigo
const UNIFIED_BG = 'rgba(79, 70, 229, 0.1)';

const MANAGE_ITEMS: CardItem[] = [
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart2,
  },
  {
    label: 'Comments',
    href: '/admin/comments',
    icon: MessageSquare,
  },
  {
    label: 'Media',
    href: '/admin/media',
    icon: ImageIcon,
  },
  {
    label: 'Categories',
    href: '/admin/categories',
    icon: Library,
  },
  {
    label: 'Sequels',
    href: '/admin/sequels',
    icon: Layers,
  },
  {
    label: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: ScrollText,
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

  // Pad the array to make the grid exactly divisible by 3 (optional, to keep borders neat)
  // The image shows 6 items. We have 7. A 3-column grid is fine.
  
  return (
    <div className="font-sans antialiased min-h-screen pb-28 px-4 pt-6 bg-[var(--color-background)]">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-8 mt-2">
          <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)] shrink-0 hidden sm:flex hover:bg-[var(--color-surface)]">
            <Link href="/admin">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="w-12 h-12 rounded-2xl bg-[#4f46e5]/10 border border-[#4f46e5]/20 flex items-center justify-center flex-shrink-0">
            <SlidersHorizontal className="w-6 h-6 text-[#4f46e5]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-text)]">
              Manage Operations
            </h1>
            <p className="text-sm text-[var(--color-muted)] font-medium mt-0.5">
              Admin tools & platform settings
            </p>
          </div>
        </div>

        {/* ── Minimalist Grid ─────────────────────────────────── */}
        <div className="bg-[var(--color-surface)] rounded-[2rem] border border-[var(--color-border)] shadow-sm px-2 py-6 sm:p-8 animate-fade-up">
          <div className="grid grid-cols-3">
            {items.map((item, idx) => {
              const isLastCol = idx % 3 === 2;
              const isLastRow = Math.floor(idx / 3) === Math.floor((items.length - 1) / 3);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => {
                    // Vibrate for physical feedback if supported
                    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                       window.navigator.vibrate(30);
                    }
                  }}
                  className={`relative flex flex-col items-center justify-center py-8 group transition-all duration-100 hover:bg-[var(--color-text)]/5 active:bg-[var(--color-text)]/10 active:scale-[0.98] active:opacity-90 rounded-2xl ${
                    !isLastCol ? 'border-r border-[var(--color-border)]/40' : ''
                  } ${
                    !isLastRow ? 'border-b border-[var(--color-border)]/40' : ''
                  }`}
                  style={{
                    // Removing borders on hover to let the exact rounded rect feel prominent,
                    // but standard CSS keeps the border structural.
                    borderRightWidth: !isLastCol ? '1px' : '0px',
                    borderBottomWidth: !isLastRow ? '1px' : '0px',
                    borderRadius: 0, // ensure no rounding to break border matrix
                  }}
                >
                  {/* Icon Wrapper */}
                  <div
                    className="w-[60px] h-[60px] rounded-full flex items-center justify-center mb-3 transition-transform duration-200 group-hover:-translate-y-1"
                    style={{ background: UNIFIED_BG }}
                  >
                    <item.icon size={26} style={{ color: UNIFIED_COLOR }} strokeWidth={1.5} />
                  </div>

                  {/* Text Label */}
                  <div className="flex items-center justify-center">
                    <p className="font-semibold text-[13px] text-[var(--color-text)] tracking-tight">
                      {item.label}
                    </p>
                    {item.badge ? (
                      <span className="ml-[5px] w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 flex-shrink-0" />
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
