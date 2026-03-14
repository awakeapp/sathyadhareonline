import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Settings, Mail, Shield, IndianRupee,
  ChevronRight, ChevronLeft, Search, QrCode
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const MORE_GROUPS = [
  {
    title: 'Settings',
    items: [
      { label: 'Avatar & Branding', href: '/admin/settings', icon: Settings },
      { label: 'Lists & Navigation', href: '/admin/settings?section=lists', icon: Search },
      { label: 'Friday Messages', href: '/admin/friday', icon: Mail },
    ]
  },
  {
    title: 'System & Privacy',
    items: [
      { label: 'Security & Privacy', href: '/admin/security', icon: Shield },
      { label: 'Payments & Subscriptions', href: '/admin/financial', icon: IndianRupee },
    ]
  }
];

export default async function MorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();
  
  if (!profile || profile.role !== 'super_admin') redirect('/admin?error=unauthorized');

  return (
    <div className="min-h-screen bg-[#f2f2f6] dark:bg-black pt-[var(--admin-header-h,60px)] pb-[80px]">
      {/* Top native-style header */}
      <div className="fixed top-0 left-0 right-0 h-[var(--admin-header-h,60px)] bg-[#f2f2f6] dark:bg-black z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
           <Link href="/admin"><ChevronLeft size={28} className="text-blue-500" /></Link>
        </div>
        <div className="flex items-center gap-4 text-zinc-800 dark:text-zinc-200">
           <Search size={24} strokeWidth={1.5} />
           <QrCode size={24} strokeWidth={1.5} />
        </div>
      </div>
      
      <div className="px-4 py-4 max-w-2xl mx-auto space-y-8">
        {/* Profile Card */}
        <div className="flex items-center gap-4 bg-[var(--color-surface)] p-4 rounded-2xl shadow-sm border border-[var(--color-border)]">
           <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold uppercase shrink-0">
             {(profile?.full_name || 'A').charAt(0)}
           </div>
           <div className="flex-1">
             <h1 className="text-[20px] font-semibold text-[var(--color-text)] leading-tight">{profile.full_name || 'Administrator'}</h1>
             <p className="text-[14px] text-zinc-500 mt-1">Super Admin • System Access</p>
           </div>
           <ChevronRight size={20} className="text-zinc-400" />
        </div>

        {/* List Groups */}
        {MORE_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx}>
            {group.title && (
               <h3 className="text-[13px] font-medium text-zinc-500 uppercase tracking-widest pl-4 mb-2">{group.title}</h3>
            )}
            <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
               {group.items.map((item, itemIdx) => {
                 const isLast = itemIdx === group.items.length - 1;
                 const Icon = item.icon;
                 return (
                   <Link key={item.href} href={item.href} className="flex items-center gap-4 pl-4 min-h-[50px] active:bg-[var(--color-surface-2)] transition-colors">
                     <Icon size={22} className="text-zinc-700 dark:text-zinc-300 stroke-[1.5px]" />
                     <div className={`flex-1 flex flex-row items-center justify-between min-h-[50px] pr-4 ${!isLast ? 'border-b border-[var(--color-border)]' : ''}`}>
                        <span className="text-[16px] text-[var(--color-text)]">{item.label}</span>
                        <ChevronRight size={20} className="text-zinc-300 dark:text-zinc-600" />
                     </div>
                   </Link>
                 );
               })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
