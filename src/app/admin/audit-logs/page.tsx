import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import AuditLogsClient from './AuditLogsClient';
import { getAuditLogsAction } from './actions';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?error=unauthorized');
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name', { ascending: true });

  const usersList = (profiles || []).map(p => ({
    id: p.id,
    name: p.full_name || '',
    email: p.email || ''
  }));

  if (error) {
    console.error('Error fetching users for audit logs:', error);
  }

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let initialLogs: any[] = [];
  let initialCount = 0;
  try {
    const res = await getAuditLogsAction({
      page: 1,
      limit: 20,
      userId: 'all',
      actionSearch: '',
      startDate: '',
      endDate: ''
    });
    initialLogs = res.logs;
    initialCount = res.count;
  } catch (err) {
    console.error('Failed to prefetch audit logs', err);
  }

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Audit Logs" 
        hideActions={true} 
      />
      
      <div className="w-full flex flex-col gap-4 relative z-20">
        <AuditLogsClient usersList={usersList} initialLogs={initialLogs as any[]} initialCount={initialCount} />
      </div>
    </PresenceWrapper>
  );
}
