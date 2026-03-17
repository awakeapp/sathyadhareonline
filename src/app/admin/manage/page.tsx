import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Users, BarChart2, MessageSquare, Image as ImageIcon,
  Layers, ScrollText, Library, LucideIcon,
  SlidersHorizontal
} from 'lucide-react';
import { 
  PresenceWrapper, 
  PresenceHeader,
  PresenceActionTile,
  PresenceCard 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

interface CardItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

const MANAGE_ITEMS: CardItem[] = [
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { label: 'Comments', href: '/admin/comments', icon: MessageSquare },
  { label: 'Media', href: '/admin/media', icon: ImageIcon },
  { label: 'Categories', href: '/admin/categories', icon: Library },
  { label: 'Sequels', href: '/admin/sequels', icon: Layers },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
];

export default async function ManagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || profile.role !== 'super_admin') redirect('/dashboard/admin?denied=1');

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

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Manage Platform" 
        profileName={profile?.full_name || 'Admin'}
        initials={initials}
        roleLabel={profile?.role}
      />
      
      <div className="w-full flex flex-col gap-4 relative z-20 max-w-4xl mx-auto">
        <PresenceCard>
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-zinc-900 dark:text-zinc-50 shadow-inner">
                 <SlidersHorizontal className="w-6 h-6" strokeWidth={1.25} />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">Super Admin Controls</h2>
                 <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mt-1">Super Admin Access Only</p>
              </div>
           </div>

           <div className="grid grid-cols-3 gap-y-6 gap-x-2">
             {items.map((item) => {
                const Icon = item.icon;
                return (
                 <PresenceActionTile 
                   key={item.href}
                   iconNode={<Icon className="w-6 h-6" strokeWidth={1.5} />}
                   label={item.label}
                   href={item.href}
                   badge={item.badge ? true : false}
                 />
                );
             })}
           </div>
        </PresenceCard>
      </div>
    </PresenceWrapper>
  );
}
