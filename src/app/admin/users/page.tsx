import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Bell } from 'lucide-react';
import UserManagementClient from './UserManagementClient';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') redirect('/admin');

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminAuth = createAdminClient();
  
  // Fetch all users from Auth directly (source of truth)
  const { data: authData } = await adminAuth.auth.admin.listUsers();
  const authUsers = authData?.users || [];

  // Fetch all profiles
  const { data: fetchUsers, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status, created_at')
    .order('created_at', { ascending: false });
    
  let profileRecords = fetchUsers || [];

  if (error) {
    console.warn('Could not fetch with status (migration likely missing), falling back:', error.message);
    const fallback = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false });
    profileRecords = (fallback.data || []).map(u => ({ ...u, status: 'active' }));
  }
  
  // Merge Auth users with Profiles to ensure no user is left behind
  const profileMap = new Map(profileRecords.map(p => [p.id, p]));
  
  const users: UserProfile[] = authUsers.map(au => {
    const profile = profileMap.get(au.id);
    return {
      id: au.id,
      email: au.email || profile?.email || null,
      full_name: profile?.full_name || au.user_metadata?.full_name || null,
      role: profile?.role || au.user_metadata?.role || 'reader',
      status: profile?.status || 'active',
      created_at: profile?.created_at || au.created_at,
    };
  });
  
  // Sort by created_at desc
  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const initials  = (profile?.full_name || user.email || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Presence"
        roleLabel="User Management · Master Control"
        initials={initials}
        icon1={Bell}
        icon2={ChevronLeft}
        onIcon2Click={() => window.location.href = '/admin'}
      />
      
      <div className="px-5 -mt-8 pb-10 space-y-6 relative z-20">
        <UserManagementClient users={(users as UserProfile[]) || []} currentUserRole={profile.role} />
      </div>
    </PresenceWrapper>
  );
}
