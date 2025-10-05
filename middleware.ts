// ============================================
// middleware.ts (Root level)
// ============================================
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isUserRoute = request.nextUrl.pathname.startsWith('/user')
  const isLoginRoute = request.nextUrl.pathname === '/login'

  // Redirect to login if not authenticated
  if (!user && (isAdminRoute || isUserRoute)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to home if authenticated and on login page
  if (user && isLoginRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Role-based access control
  if (user && (isAdminRoute || isUserRoute)) {
    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      // Profile not found, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user has correct role for the route
    if (isAdminRoute && profile.role !== 'admin') {
      // Non-admin trying to access admin route, redirect to user dashboard
      return NextResponse.redirect(new URL('/user', request.url))
    }

    if (isUserRoute && profile.role !== 'user') {
      // Non-user trying to access user route, redirect to admin dashboard
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}