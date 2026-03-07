import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route access rules — middleware is the outermost gate
const ROUTE_ROLES: Record<string, string[] | '*'> = {
  '/admin':  ['super_admin', 'admin'],
  '/editor': ['editor'],
  '/profile': '*',
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
  if (pathname.startsWith('/auth/callback') || pathname === '/suspended') return supabaseResponse

  // Helper to safely redirect while preserving refreshed cookies
  const redirectWithCookies = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    const redirectRes = NextResponse.redirect(url)
    
    // Apply cookies from supabaseResponse using the cookies API 
    // to properly preserve all attributes (max-age, path, secure, etc.)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie)
    })
    
    return redirectRes
  }

  // 1. Check Protected Routes
  const protectedPrefix = Object.keys(ROUTE_ROLES).find(prefix => pathname.startsWith(prefix))

  if (protectedPrefix) {
    if (!user) return redirectWithCookies('/login')

    // SELECT BOTH: If 'status' column is missing (e.g. migration not applied), 
    // the query will return an error and role will be null, triggering a redirect to /login.
    const { data: firstTry } = await supabase
      .from('profiles').select('role, status').eq('id', user.id).single()

    let profile: { role?: string; status?: string } | null = firstTry

    // FALLBACK: If role is null but user exists, they might be missing the 'status' column.
    // We try to fetch just the role to break the redirect loop.
    if (!profile?.role) {
      const { data: fallback } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      profile = fallback
    }

    const role = profile?.role as string | undefined
    const status = profile?.status as string | undefined
    const allowed = ROUTE_ROLES[protectedPrefix]

    if (status === 'suspended' || status === 'banned') {
      return redirectWithCookies('/suspended')
    }

    if (allowed !== '*') {
      if (!role || !allowed.includes(role)) {
        return redirectWithCookies('/login')
      }
    }
  }

  // 1b. Check status for non-protected routes too if logged in
  if (user && pathname !== '/suspended' && !pathname.startsWith('/auth') && pathname !== '/login') {
    // Gracefully handle missing status column here too
    const { data: profile } = await supabase
      .from('profiles').select('status').eq('id', user.id).single()
    if (profile?.status === 'suspended' || profile?.status === 'banned') {
      return redirectWithCookies('/suspended')
    }
  }

  // 2. Auth Pages Routing (Skip login/signup if already logged in)
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role as string | undefined

    if (role === 'super_admin' || role === 'admin') {
      return redirectWithCookies('/admin')
    } else if (role === 'editor') {
      return redirectWithCookies('/editor')
    } else {
      return redirectWithCookies('/')
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
