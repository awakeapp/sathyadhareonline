import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route access rules
const ROUTE_ROLES: Record<string, string[]> = {
  '/admin':  ['super_admin', 'admin'],
  '/editor': ['super_admin', 'admin', 'editor'],
  '/app':    ['super_admin', 'admin', 'editor', 'reader'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Verify JWT with Supabase (never trust cookie data alone)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ---------- Bypass route guards for auth callback ----------
  if (pathname.startsWith('/auth/callback')) {
    return response
  }

  // ---------- Auth guard for protected routes ----------
  const protectedPrefix = Object.keys(ROUTE_ROLES).find((prefix) =>
    pathname.startsWith(prefix)
  )

  if (protectedPrefix) {
    // Must be logged in
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Fetch role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role as string | undefined

    const allowedRoles = ROUTE_ROLES[protectedPrefix]
    if (!role || !allowedRoles.includes(role)) {
      // Redirect unauthorized users to login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // ---------- Redirect logged-in users away from /login and /signup ----------
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role as string | undefined

    if (role === 'super_admin' || role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    } else if (role === 'editor') {
      return NextResponse.redirect(new URL('/editor', request.url))
    } else {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
