import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route access rules — proxy is the outermost gate
const ROUTE_ROLES: Record<string, string[] | '*'> = {
  '/admin':      ['super_admin', 'admin', 'editor'],
  '/editor':     ['editor'],
  '/contributor':['contributor'],
  '/dashboard':  '*',   // any authenticated user; page-level does role redirect
  '/profile':    '*',
  '/saved':      '*',
  '/highlights': '*',
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // This updates the request cookies for Server Components!
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

          // CRITICAL: Next.js 14/15 'cookies()' API uses the RAW string header, 
          // not the request.cookies map. If we don't update the raw string, Server 
          // Components evaluate the old expired token and redirect to /login randomly!
          const rawCookies = request.cookies.getAll()
          request.headers.set(
            'cookie',
            rawCookies.map(c => `${c.name}=${c.value}`).join('; ')
          )

          // Recreate the response to properly forward the modified request headers
          supabaseResponse = NextResponse.next({ request })

          // Set the updated cookies on the outgoing response so the browser saves them
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verify JWT (also implicitly triggers a session refresh if expired)
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  if (pathname.startsWith('/auth/callback')) return supabaseResponse

  // Helper to safely redirect while preserving refreshed cookies
  const redirectWithCookies = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    const redirectRes = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectRes
  }

  // ── Maintenance Mode check ──────────────────────────────────────────
  const maintenancePassthrough =
    pathname.startsWith('/maintenance') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth') ||
    pathname === '/favicon.ico'

  if (!maintenancePassthrough) {
    try {
      const { data: siteSettings } = await supabase
        .from('site_settings')
        .select('maintenance_mode, maintenance_whitelist')
        .eq('id', 1)
        .maybeSingle()

      if (siteSettings?.maintenance_mode) {
        const ip =
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request.headers.get('x-real-ip')?.trim() ||
          ''

        const whitelist = (siteSettings.maintenance_whitelist || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)

        // Reuse already-resolved user; also check role for admin bypass
        let isAdmin = false
        if (user) {
          const { data: mProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
          if (mProfile?.role === 'super_admin' || mProfile?.role === 'admin') {
            isAdmin = true
          }
        }

        const isWhitelisted = isAdmin || whitelist.includes(ip)
        if (!isWhitelisted) {
          return redirectWithCookies('/maintenance')
        }
      }
    } catch {
      // If DB is unreachable, fail open to avoid false lockouts
    }
  }
  // ── End Maintenance Mode check ──────────────────────────────────────

  // 1. Identify protective rule
  const protectedPrefix = Object.keys(ROUTE_ROLES).find(prefix => pathname.startsWith(prefix))

  if (protectedPrefix) {
    if (!user) {
      // Not logged in -> redirect to login
      return redirectWithCookies('/login')
    }

    const allowed = ROUTE_ROLES[protectedPrefix]

    // For public-but-auth routes ('*'), we just need the 'user' to exist.
    // However, we still check for 'suspended' status if we can find it.
    // To be robust, we only perform the database lookup once.
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .maybeSingle()

      const status = profile?.status
      const role = profile?.role

      if (status === 'suspended' || status === 'banned') {
        return redirectWithCookies('/login?error=account_suspended')
      }

      // If specific roles are required, check them now.
      if (allowed !== '*') {
        if (!role || !allowed.includes(role)) {
          // Logged in but wrong role -> redirect to login (or access denied)
          return redirectWithCookies('/login')
        }
      }
    } catch (e) {
      // If DB fails, allow '*' routes through if user exists
      if (allowed !== '*') {
        return redirectWithCookies('/login')
      }
    }
  }

  // 2. Auth Pages Routing (Skip login/signup if already logged in)
  if (user && (pathname === '/login' || pathname === '/signup')) {
    try {
      const { data: profile } = await supabase
        .from('profiles').select('role, status').eq('id', user.id).maybeSingle()
      
      if (profile?.status === 'suspended' || profile?.status === 'banned') {
        return supabaseResponse 
      }

      const role = profile?.role
      if (role === 'super_admin' || role === 'admin') {
        return redirectWithCookies('/admin')
      } else if (role === 'editor') {
        return redirectWithCookies('/editor')
      } else if (role === 'contributor') {
        return redirectWithCookies('/contributor')
      } else {
        return redirectWithCookies('/')
      }
    } catch (e) {
      return redirectWithCookies('/')
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
