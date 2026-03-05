import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route access rules — middleware is the outermost gate
const ROUTE_ROLES: Record<string, string[]> = {
  '/admin':  ['super_admin', 'admin'],
  '/editor': ['editor'],
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
          // Recreate the response to properly forward the modified request
          supabaseResponse = NextResponse.next({ request })
          // Set the updated cookies on the outgoing response so the browser gets them
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
    
    // Copy any Set-Cookie headers from the refreshed supabaseResponse
    const setCookies = supabaseResponse.headers.getSetCookie()
    for (const cookie of setCookies) {
      redirectRes.headers.append('Set-Cookie', cookie)
    }
    return redirectRes
  }

  // 1. Check Protected Routes
  const protectedPrefix = Object.keys(ROUTE_ROLES).find(prefix => pathname.startsWith(prefix))

  if (protectedPrefix) {
    if (!user) return redirectWithCookies('/login')

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()

    const role = profile?.role as string | undefined
    const allowed = ROUTE_ROLES[protectedPrefix]

    if (!role || !allowed.includes(role)) {
      return redirectWithCookies('/login')
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
