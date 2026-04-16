import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE } from '@/features/auth/constants'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get(AUTH_COOKIE)

  const isAuthRoute = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')
  const isApiRoute = pathname.startsWith('/api')
  const isPublicRoute = pathname.startsWith('/oauth') || pathname === '/favicon.ico'

  if (!session && !isAuthRoute && !isApiRoute && !isPublicRoute) {
    const url = new URL('/sign-in', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
