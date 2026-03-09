import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/forgot-password']
const API_ROUTES = ['/api/']
const STATIC_ROUTES = ['/_next/', '/favicon.ico', '/images/', '/icons/']

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
}

function isStaticOrApi(pathname: string) {
  return [...API_ROUTES, ...STATIC_ROUTES].some((r) => pathname.startsWith(r))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes and static files
  if (isStaticOrApi(pathname)) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — this also updates cookies if the session was refreshed
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isPublic = isPublicRoute(pathname)

  // Not authenticated → redirect to login (except for public routes)
  if (!session && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    // Preserve the original destination so we can redirect back after login
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirectTo', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated → redirect away from login/auth pages
  if (session && isPublic) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  // Match all paths except _next internals, static files, and image optimization
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
