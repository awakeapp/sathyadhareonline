import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Fetch the user's role from the profiles table and return the
 * correct destination path.
 */
export async function getRedirectPath(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const role = (profile?.role as string | undefined) ?? 'reader'

  if (role === 'super_admin' || role === 'admin') return '/admin'
  if (role === 'editor') return '/editor'
  return '/'
}
