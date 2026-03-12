import { createClient } from '@supabase/supabase-js'

/**
 * Super Admin / System Client
 * Uses SERVICE_ROLE_KEY to bypass RLS and use Auth Admin API.
 * ONLY use this in server actions, NEVER expose to client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY or URL is not defined. Admin client will be disabled.');
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
