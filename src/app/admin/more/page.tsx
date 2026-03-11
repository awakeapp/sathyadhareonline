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
        title="Presence"
        roleLabel="System Utility · More Protocols"
        initials={initials}
        icon1={Bell}
        icon2={ChevronLeft}
        onIcon2Click={() => window.location.href = '/admin'}
      />
      
      <div className="px-5 -mt-8 pb-10 space-y-6 relative z-20 max-w-4xl mx-auto">
        <PresenceCard className="p-8">
           <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 rounded-[1.5rem] bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 shadow-inner">
                 <MoreHorizontal className="w-7 h-7" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-[#1b1929] dark:text-white uppercase tracking-tight">System Utility</h2>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Peripheral Protocol Configuration</p>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             {MORE_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className="group">
                   <div className="p-6 rounded-[2rem] bg-gray-50 dark:bg-white/5 border border-transparent group-hover:border-indigo-100 dark:group-hover:border-indigo-500/20 transition-all duration-300 flex items-center gap-5 active:scale-[0.98]">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: `${item.color}15` }}>
                         <item.icon size={26} style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h3 className="text-lg font-black text-[#1b1929] dark:text-white uppercase tracking-tight group-hover:text-[#5c4ae4] transition-colors">{item.label}</h3>
                         <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1 truncate">{item.sub}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-[#5c4ae4] group-hover:translate-x-1 transition-all" />
                   </div>
                </Link>
             ))}
           </div>
        </PresenceCard>
      </div>
    </PresenceWrapper>
  );
}
