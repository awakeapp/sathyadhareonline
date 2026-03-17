/**
 * /dashboard/admin
 *
 * Entry point for the Admin dashboard.
 * Validates the user's role server-side, then redirects to
 * the rich /admin UI.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role as string | undefined

  // admin and super_admin may both access the main admin area
  if (role === 'admin' || role === 'super_admin') {
    redirect('/admin')
  }

  // Wrong role — send them to their own dashboard
  if (role === 'editor') redirect('/dashboard/editor')
  redirect('/dashboard/reader')
}
