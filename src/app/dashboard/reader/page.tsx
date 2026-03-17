/**
 * /dashboard/reader
 *
 * Default landing for readers (and any authenticated user
 * whose role is unknown / not set in the profiles table).
 *
 * Readers don't have a private dashboard — they land on the
 * public home page ("/") which shows the Sathyadhare feed.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ReaderDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role as string | undefined

  // Send privileged roles to their actual dashboard
  if (role === 'super_admin') redirect('/dashboard/super-admin')
  if (role === 'admin')       redirect('/dashboard/admin')
  if (role === 'editor')      redirect('/dashboard/editor')

  // Reader (or no role set) → public home feed
  redirect('/')
}
