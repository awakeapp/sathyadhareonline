import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import PlansClient from './PlansClient';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';
import AdminContainer from '@/components/layout/AdminContainer';

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') redirect('/dashboard/admin?denied=1');

  const { data: plans } = await supabase.from('subscription_plans').select('*').order('created_at', { ascending: true });

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Super Admin"
        roleLabel="Subscription Plans"
        initials={initials}
        icon1Node={<ChevronLeft className="w-6 h-6" strokeWidth={1.25} />}
        icon1Href="/admin"
        icon2Node={<Bell className="w-6 h-6" strokeWidth={1.25} />}
      />
      
      <AdminContainer className="flex flex-col gap-4 relative z-20">
        <PlansClient initialPlans={plans || []} />
      </AdminContainer>
    </PresenceWrapper>
  );
}
