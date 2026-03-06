import { createClient } from '@supabase/supabase-js'

/**
 * Super Admin / System Client
 * Uses SERVICE_ROLE_KEY to bypass RLS and use Auth Admin API.
 * ONLY use this in server actions, NEVER expose to client.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
