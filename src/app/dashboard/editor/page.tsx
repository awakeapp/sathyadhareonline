/**
 * /dashboard/editor
 *
 * Entry point for the Editor dashboard.
 * Validates the user's role server-side, then redirects to
 * the rich /editor UI.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role as string | undefined

  // Only editors may access this route
  if (role === 'editor') {
    redirect('/editor')
  }

  // Wrong role — send them to their own dashboard
  if (role === 'super_admin') redirect('/dashboard/super-admin')
  if (role === 'admin')       redirect('/dashboard/admin')
  redirect('/dashboard/reader')
}
