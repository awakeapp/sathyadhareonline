import { createClient } from '@/lib/supabase/server';

export type Role = 'super_admin' | 'admin' | 'editor' | 'reader';

export async function verifyRole(allowedRoles: Role[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !allowedRoles.includes(profile.role as Role)) {
    throw new Error('Unauthorized');
  }
  
  return { user, profile };
}
