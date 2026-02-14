import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getSetCookie().map(cookie => {
            const [name, ...rest] = cookie.split('=')
            const value = rest.join('=')
            return { name, value }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh auth session
  await supabase.auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isRootRoute = request.nextUrl.pathname === '/'

  // Redirect authenticated users away from login/auth pages
  if (user && isAuthRoute && request.nextUrl.pathname !== '/auth/callback') {
    return response.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users away from dashboard
  if (!user && isDashboardRoute) {
    return response.redirect(new URL('/auth/login', request.url))
  }

  // Let root page handle its own redirects
  if (isRootRoute || request.nextUrl.pathname === '/auth/callback') {
    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
