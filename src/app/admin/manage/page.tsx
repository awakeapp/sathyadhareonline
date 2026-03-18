import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Users, BarChart2, MessageSquare, Image as ImageIcon,
  Layers, ScrollText, Library, LucideIcon,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface CardItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  description: string;
}

const MANAGE_ITEMS: CardItem[] = [
  { label: 'People', href: '/admin/users', icon: Users, description: 'Manage accounts and roles' },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart2, description: 'Platform growth and traffic' },
  { label: 'Comments', href: '/admin/comments', icon: MessageSquare, description: 'Moderate reader discussion' },
  { label: 'Media', href: '/admin/media', icon: ImageIcon, description: 'Global asset library' },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText, description: 'Admin activity history' },
];

export default async function ManagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'super_admin') {
    redirect('/admin?denied=1');
  }

  let pendingComments = 0;
  try {
    const { count: cc } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    pendingComments = cc ?? 0;
  } catch { /* non-fatal */ }

  const items: CardItem[] = MANAGE_ITEMS.map(i =>
    i.href === '/admin/comments' && pendingComments > 0
      ? { ...i, badge: pendingComments }
      : i
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] active:scale-[0.98] transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)]/20 transition-colors">
                <Icon size={22} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-[var(--color-text)] leading-tight">{item.label}</p>
                  {item.badge && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[var(--color-muted)] mt-0.5 truncate">{item.description}</p>
              </div>
              <ChevronRight size={16} className="text-[var(--color-muted)] opacity-50" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
