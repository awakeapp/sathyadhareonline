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
  last_sign_in_at?: string | null;
  permissions?: {
    can_articles: boolean;
    can_sequels: boolean;
    can_library: boolean;
  };
}

export default async function AdminUsersPage() {
  // 1. Verify requesting user is super_admin (regular client — RLS is correct here)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || profile.role !== 'super_admin') redirect('/admin?denied=1');

  // 2. Use the ADMIN client for all data fetches — bypasses RLS so we see ALL rows.
  //    This is the root fix for roles showing as "reader": the regular client was
  //    restricted by RLS and only returned the current user's own profile row.
  const adminClient = createAdminClient();
  if (!adminClient) {
    return (
      <div className="p-8 text-center text-rose-500 font-bold">
        Admin client unavailable — SUPABASE_SERVICE_ROLE_KEY not configured.
      </div>
    );
  }

  // 3. Fetch all auth users (email, last_sign_in_at, user_metadata)
  let authUsers: {
    id: string;
    email?: string;
    created_at: string;
    last_sign_in_at?: string | null;
    user_metadata?: Record<string, unknown>;
  }[] = [];

  try {
    const { data: authData, error: authErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (authErr) console.error('[AdminUsers] Auth listUsers error:', authErr.message);
    authUsers = authData?.users || [];
  } catch (err) {
    console.error('[AdminUsers] Auth fetch failed:', err);
  }

  // 4. Fetch ALL profiles via admin client (bypasses RLS)
  const { data: profileRows, error: profileError } = await adminClient
    .from('profiles')
    .select('id, full_name, email, role, status, created_at')
    .order('created_at', { ascending: false });

  if (profileError) {
    console.error('[AdminUsers] Profile fetch error:', profileError.message);
  }

  // 5. Fetch ALL permissions via admin client (bypasses RLS)
  const { data: permissionRows } = await adminClient
    .from('user_content_permissions')
    .select('user_id, can_articles, can_sequels, can_library');

  // 6. Build lookup maps
  const profileMap = new Map<string, any>((profileRows || []).map((p: any) => [p.id, p]));
  const permissionsMap = new Map<string, any>((permissionRows || []).map((p: any) => [p.user_id, p]));

  // 7. Merge: Auth → Profiles → Permissions
  const source = authUsers.length > 0 ? authUsers : (profileRows || []);
  const users: UserProfile[] = source.map((au: any) => {
    const uProfile = profileMap.get(au.id);
    const uPerms = permissionsMap.get(au.id);

    // Realistic role detection (FIX): 
    // We check both sources. If the metadata role is a valid staff role, use it.
    // Otherwise, if the profile table role is a valid staff role, use that.
    const metaRole = (au.user_metadata?.role as string || '').toLowerCase().trim().replace(/\s+/g, '_');
    const tableRole = (uProfile?.role as string || '').toLowerCase().trim().replace(/\s+/g, '_');
    
    // Logic: If either is a staff role (not reader/empty), use it. Table role usually more reliable for existing users.
    const isValidStaff = (r: string) => ['admin', 'super_admin', 'editor'].includes(r);
    const role = isValidStaff(tableRole) ? tableRole : (isValidStaff(metaRole) ? metaRole : 'reader');

    return {
      id: au.id,
      email: au.email || uProfile?.email || null,
      full_name: uProfile?.full_name || (au.user_metadata?.full_name as string) || (au.email?.split('@')[0]) || 'Member',
      role,
      status: uProfile?.status || 'active',
      created_at: uProfile?.created_at || au.created_at,
      last_sign_in_at: au.last_sign_in_at || null,
      avatar_url: uProfile?.avatar_url || (au.user_metadata?.avatar_url as string) || null,
      permissions: uPerms
        ? {
            can_articles: uPerms.can_articles ?? (role === 'super_admin' ? true : true),
            can_sequels: uPerms.can_sequels ?? (role === 'super_admin' ? true : false),
            can_library: uPerms.can_library ?? (role === 'super_admin' ? true : false),
          }
        : { 
            can_articles: true, 
            can_sequels: role === 'super_admin', 
            can_library: role === 'super_admin' 
          },
    };
  });

  // 8. Sort newest join date first
  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="flex flex-col gap-6">
      <div className="pt-2">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">People</h1>
        <p className="text-[14px] text-[var(--color-muted)] mt-1 font-medium">
          Manage staff, readers, and subscriptions
        </p>
      </div>

      <div className="w-full">
        <UserManagementClient users={users} currentUserRole={profile.role} />
      </div>
    </div>
  );
}
