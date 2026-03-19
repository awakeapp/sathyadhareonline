import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getRedirectUrl } from '@/lib/auth/redirectAfterLogin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const returnTo = searchParams.get('return_to') || searchParams.get('next')

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
      // Capture security metrics
      const ip = (request as any).ip || request.headers.get('x-forwarded-for')?.split(',')[0] || 'Unknown';
      const agent = request.headers.get('user-agent') || 'Unknown Agent';

      // Check if user has a profile row
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      let role = profile?.role

      if (!profile) {
        // If no profile exists (first time Google login), create one
        role = data.user.user_metadata?.role ?? 'reader'
        try {
          const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || ''
          const avatarUrl = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || ''
          
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            avatar_url: avatarUrl,
            role: role,
            last_sign_in_ip: ip,
            last_sign_in_agent: agent,
          })
        } catch (e) {
          console.error("Profile creation error", e)
        }
      } else {
        // Update existing profile with latest security data
        try {
          const { logAuditEvent } = await import('@/lib/audit');
          await supabase.from('profiles')
            .update({ 
              last_sign_in_ip: ip, 
              last_sign_in_agent: agent,
              last_sign_in_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', data.user.id);
            
          await logAuditEvent(data.user.id, 'LOGIN_SESSION_EXCHANGE');
        } catch (e) {
          console.error("Security data update error", e)
        }
      }

      const destination = getRedirectUrl(role, returnTo)
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  // Fallback — send back to login with error indicator
  return NextResponse.redirect(new URL('/sign-in?error=oauth_failed', request.url))
}
