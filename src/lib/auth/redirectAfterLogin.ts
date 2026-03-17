import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Maps a role to its canonical dashboard path.
 *
 * Role → Dashboard
 * ─────────────────────────────
 * super_admin  →  /dashboard/super-admin
 * admin        →  /dashboard/admin
 * editor       →  /dashboard/editor
 * reader       →  /dashboard/reader   (also the default)
 */
export function getDashboardForRole(role: string): string {
  switch (role) {
    case 'super_admin': return '/dashboard/super-admin'
    case 'admin':       return '/dashboard/admin'
    case 'editor':      return '/dashboard/editor'
    default:            return '/dashboard/reader'
  }
}

/**
 * Pure function: given a role and an optional ?return_to path,
 * returns the URL the user should land on after sign-in.
 *
 * Security rules:
 * - /dashboard/* paths are allowed only if the role matches
 * - /admin/*   paths are allowed only for super_admin / admin
 * - /editor/*  paths are allowed only for editors
 * - Any non-sensitive path is passed through for all roles
 * - Anything that doesn't match the rules falls back to the
 *   role's canonical dashboard
 */
export function getRedirectUrl(role: string, requestedPath?: string | null): string {
  if (requestedPath) {
    // Dashboard sub-routes — validate role matches the segment
    if (requestedPath.startsWith('/dashboard/super-admin') && role === 'super_admin') return requestedPath
    if (requestedPath.startsWith('/dashboard/admin')       && (role === 'admin' || role === 'super_admin')) return requestedPath
    if (requestedPath.startsWith('/dashboard/editor')      && role === 'editor') return requestedPath
    if (requestedPath.startsWith('/dashboard/reader')      && role === 'reader') return requestedPath

    // Legacy direct routes — kept for backward compat
    if (requestedPath.startsWith('/admin')  && (role === 'super_admin' || role === 'admin')) return requestedPath
    if (requestedPath.startsWith('/editor') && role === 'editor') return requestedPath

    // Public / profile paths — any authenticated user can go here
    const isPrivilegedRoute =
      requestedPath.startsWith('/dashboard') ||
      requestedPath.startsWith('/admin')     ||
      requestedPath.startsWith('/editor')
    if (!isPrivilegedRoute) return requestedPath
  }

  // Fallback: always land on the role's canonical dashboard
  return getDashboardForRole(role)
}

/**
 * Fetch the user's role from the profiles table and return
 * the correct destination path after sign-in.
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
