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
    .single();

  if (!profile || profile.role !== 'super_admin') {
    redirect('/admin?error=unauthorized');
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
        title="Super Admin"
        roleLabel="Security Protocol · Zero Trust"
        initials={initials}
        icon1={Bell}
        icon2={ChevronLeft}
        icon2Href="/admin"
      />
      
      <div className="p-4 flex flex-col gap-4 relative z-20">
        <SecurityClient initialKeys={keys || []} />
      </div>
    </PresenceWrapper>
  );
}
