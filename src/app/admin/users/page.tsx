import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import UserManagementClient from './UserManagementClient';
import { createAdminClient } from '@/lib/supabase/admin';

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
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') redirect('/admin?denied=1');

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

  // Fetch all profiles and permissions
  const { data: fetchUsers, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status, created_at')
    .order('created_at', { ascending: false });

  const { data: fetchPermissions } = await supabase
    .from('user_content_permissions')
    .select('*');

  const permissionsMap = new Map(fetchPermissions?.map(p => [p.user_id, p]) || []);
    
  let profileRecords = fetchUsers || [];

  if (profileError) {
    console.warn('Profile fetch error:', profileError.message);
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
  
  // Merge Auth users with Profiles and Permissions
  const profileMap = new Map<string, any>(profileRecords.map((p: any) => [p.id, p]));
  
  const users: any[] = authUsers.length > 0 
    ? authUsers.map(au => {
        const uProfile = profileMap.get(au.id);
        const uPerms = permissionsMap.get(au.id);
        return {
          id: au.id,
          email: au.email || uProfile?.email || null,
          full_name: uProfile?.full_name || au.user_metadata?.full_name || null,
          role: uProfile?.role || au.user_metadata?.role || 'reader',
          status: uProfile?.status || 'active',
          created_at: uProfile?.created_at || au.created_at,
          permissions: uPerms || { can_articles: true, can_sequels: false, can_library: false }
        };
      })
    : profileRecords.map((p: any) => {
        const uPerms = permissionsMap.get(p.id);
        return {
          id: p.id,
          email: p.email || null,
          full_name: p.full_name || null,
          role: p.role || 'reader',
          status: p.status || 'active',
          created_at: p.created_at,
          permissions: uPerms || { can_articles: true, can_sequels: false, can_library: false }
        };
      });
  
  // Sort by created_at desc
  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="pt-2">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">People</h1>
        <p className="text-[13px] text-[var(--color-muted)] mt-1">Manage user accounts, roles, and content permissions</p>
      </div>
      
      <div className="w-full">
        <UserManagementClient users={(users as UserProfile[]) || []} currentUserRole={profile.role} />
      </div>
    </div>
  );
}
