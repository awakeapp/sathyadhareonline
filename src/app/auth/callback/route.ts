import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // Ignore in context of route handler
            }
          },
        },
      }
    )

    // Exchange PKCE code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user has a profile row
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      let role = profile?.role

      if (!profile) {
        // If no profile exists (first time Google login), create one
        role = 'reader'
        // Wrap in try catch so it doesn't break if insert fails
        try {
          const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || ''
          const avatarUrl = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || ''
          
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
            avatar_url: avatarUrl,
            role: role,
          })
        } catch (e) {
          console.error("Profile creation error", e)
        }
      }

      let destination = '/'
      if (role === 'super_admin' || role === 'admin') destination = '/admin'
      else if (role === 'editor') destination = '/editor'

      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  // Fallback — send back to login with error indicator
  return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
}
