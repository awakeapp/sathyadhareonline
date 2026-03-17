/**
 * /dashboard/super-admin
 *
 * Entry point for the Super Admin dashboard.
 * Validates the user's role server-side, then redirects to
 * the rich /admin UI that already contains all super-admin features.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SuperAdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role as string | undefined

  // Only super_admin may access this route
  if (role !== 'super_admin') {
    // Wrong role — send them to their own dashboard
    if (role === 'admin')   redirect('/dashboard/admin')
    if (role === 'editor')  redirect('/dashboard/editor')
    redirect('/dashboard/reader')
  }

  // Delegate to the full admin UI
  redirect('/admin')
}
