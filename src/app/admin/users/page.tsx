import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import UserManagementClient from './UserManagementClient';
import { createAdminClient } from '@/lib/supabase/admin';
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

  let authUsers: { id: string; email?: string; created_at: string; user_metadata?: Record<string, unknown> }[] = [];
  try {
    const adminAuth = createAdminClient();
    if (adminAuth) {
      const { data: authData } = await adminAuth.auth.admin.listUsers();
      authUsers = authData?.users || [];
    }
  } catch (err) {
    console.error('[AdminUsers] Auth fetch failed:', err);
  }

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
    profileRecords = (fallback.data || []).map((u: any) => ({ 
      id: u.id, 
      full_name: u.full_name, 
      email: u.email, 
      role: u.role, 
      created_at: u.created_at, 
      status: 'active' 
    }));
  }
  
  // Merge Auth users with Profiles to ensure no user is left behind
  const profileMap = new Map<string, any>(profileRecords.map((p: any) => [p.id, p]));
  
  const users: UserProfile[] = authUsers.length > 0 
    ? authUsers.map(au => {
        const uProfile = profileMap.get(au.id);
        return {
          id: au.id,
          email: au.email || uProfile?.email || null,
          full_name: uProfile?.full_name || au.user_metadata?.full_name || null,
          role: uProfile?.role || au.user_metadata?.role || 'reader',
          status: uProfile?.status || 'active',
          created_at: uProfile?.created_at || au.created_at,
        };
      })
    : profileRecords.map((p: any) => ({
        id: p.id,
        email: p.email || null,
        full_name: p.full_name || null,
        role: p.role || 'reader',
        status: p.status || 'active',
        created_at: p.created_at
      }));
  
  // Sort by created_at desc
  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const initials  = (profile?.full_name || user.email || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Super Admin"
        roleLabel="User Management · Master Control"
        initials={initials}
        icon1Node={<Bell className="w-6 h-6" strokeWidth={1.25} />}
        icon2Node={<ChevronLeft className="w-6 h-6" strokeWidth={1.25} />}
        icon2Href="/admin"
      />
      
      <div className="p-4 flex flex-col gap-4 relative z-20">
        <UserManagementClient users={(users as UserProfile[]) || []} currentUserRole={profile.role} />
      </div>
    </PresenceWrapper>
  );
}
