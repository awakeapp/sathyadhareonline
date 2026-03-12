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

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') redirect('/admin?error=unauthorized');

  const { data: plans } = await supabase.from('subscription_plans').select('*').order('created_at', { ascending: true });

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Super Admin"
        roleLabel="Capital Config · Plan Matrix"
        initials={initials}
        icon1Node={<Bell className="w-6 h-6" strokeWidth={1.25} />}
        icon2Node={<ChevronLeft className="w-6 h-6" strokeWidth={1.25} />}
        icon2Href="/admin"
      />
      
      <div className="p-4 flex flex-col gap-4 relative z-20 max-w-4xl mx-auto">
        <PlansClient initialPlans={plans || []} />
      </div>
    </PresenceWrapper>
  );
}
