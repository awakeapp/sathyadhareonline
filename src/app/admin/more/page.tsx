import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Settings, Mail, Shield, IndianRupee,
  LucideIcon, ChevronRight, MoreHorizontal, ChevronLeft, Bell
} from 'lucide-react';
import { 
  PresenceWrapper, 
  PresenceHeader,
  PresenceCard 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

interface CardItem {
  label: string;
  sub: string;
  href: string;
  icon: LucideIcon;
  color: string;
}

const MORE_ITEMS: CardItem[] = [
  { label: 'Settings', sub: 'Site configuration & branding', href: '/admin/settings', icon: Settings, color: '#94a3b8' },
  { label: 'Email Templates', sub: 'Welcome & notifications', href: '/admin/email-templates', icon: Mail, color: '#5c4ae4' },
  { label: 'Security', sub: 'API keys & login history', href: '/admin/security', icon: Shield, color: '#f87171' },
  { label: 'Financial', sub: 'Revenue & subscriptions', href: '/admin/financial', icon: IndianRupee, color: '#34d399' },
];

export default async function MorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'super_admin') redirect('/admin?error=unauthorized');

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Super Admin"
        roleLabel="System Utility · More Protocols"
        initials={initials}
        icon1={Bell}
        icon2={ChevronLeft}
        icon2Href="/admin"
      />
      
      <div className="p-4 flex flex-col gap-4 relative z-20 max-w-4xl mx-auto">
        <PresenceCard>
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-zinc-500 shadow-inner">
                 <MoreHorizontal className="w-6 h-6" strokeWidth={1.25} />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">System Utility</h2>
                 <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mt-1">Peripheral Protocol Configuration</p>
              </div>
           </div>

           <div className="flex flex-col gap-4">
             {MORE_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className="group min-h-[44px]">
                   <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-transparent group-hover:border-indigo-100 dark:group-hover:border-indigo-500/20 transition-all duration-300 flex items-center gap-4 active:scale-[0.98]">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: `${item.color}15` }}>
                         <item.icon size={24} style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-tight group-hover:text-zinc-900 dark:text-zinc-50 transition-colors">{item.label}</h3>
                         <p className="text-xs font-medium text-zinc-500 tracking-wide mt-1 truncate">{item.sub}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 dark:text-zinc-50 group-hover:translate-x-1 transition-all" strokeWidth={1.25} />
                   </div>
                </Link>
             ))}
           </div>
        </PresenceCard>
      </div>
    </PresenceWrapper>
  );
}
