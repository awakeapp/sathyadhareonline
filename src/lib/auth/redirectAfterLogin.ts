import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Pure function to determine dashboard route natively given a role and an optional return path.
 */
export function getRedirectUrl(role: string, requestedPath?: string | null): string {
  if (requestedPath) {
    // Validate if the user's role is permitted to access the requested protected path
    if (requestedPath.startsWith('/admin') && (role === 'super_admin' || role === 'admin')) {
      return requestedPath;
    }
    if (requestedPath.startsWith('/editor') && role === 'editor') {
      return requestedPath;
    }
    // Any authenticated user can go to unprotected paths (e.g. /profile, /)
    if (!requestedPath.startsWith('/admin') && !requestedPath.startsWith('/editor')) {
      return requestedPath;
    }
  }

  // Fallbacks if no requested path or if it was blocked by the role check
  if (role === 'super_admin' || role === 'admin') return '/admin'
  if (role === 'editor') return '/editor'
  return '/'
}

/**
 * Fetch the user's role from the profiles table and return the
 * correct destination path.
 */
export async function getRedirectPath(
  supabase: SupabaseClient,
  userId: string,
  requestedPath?: string | null
): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const role = (profile?.role as string | undefined) ?? 'reader'
  return getRedirectUrl(role, requestedPath)
}
