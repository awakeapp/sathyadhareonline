import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import SecurityClient from './SecurityClient';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'super_admin') {
    redirect('/dashboard/admin?denied=1');
  }

  const { data: keys, error } = await supabase
    .from('api_keys')
    .select('id, name, prefix, permissions, created_at, last_used_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching API keys:', error);
  }

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Security" 
        hideActions={true} 
      />
      
      <div className="w-full flex flex-col gap-4 relative z-20">
        <SecurityClient initialKeys={keys || []} />
      </div>
    </PresenceWrapper>
  );
}
