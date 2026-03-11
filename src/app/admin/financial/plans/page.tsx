import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import PlansClient from './PlansClient';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
  if (!profile || profile.role !== 'super_admin') redirect('/admin?error=unauthorized');

  const { data: plans } = await supabase.from('subscription_plans').select('*').order('created_at', { ascending: true });

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Presence"
        roleLabel="Capital Config · Plan Matrix"
        initials={initials}
        icon1={Bell}
        icon2={ChevronLeft}
        icon2Href="/admin"
      />
      
      <div className="px-5 -mt-8 pb-10 space-y-6 relative z-20 max-w-4xl mx-auto">
        <PlansClient initialPlans={plans || []} />
      </div>
    </PresenceWrapper>
  );
}
