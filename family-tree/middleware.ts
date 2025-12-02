import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('familytree_session')?.value
  const { pathname } = req.nextUrl

  const isAuthPath = pathname.startsWith('/auth')
  const isApi = pathname.startsWith('/api')
  const isDashboard = pathname.startsWith('/dashboard')

  // Allow API, _next, static files, etc.
  if (isApi || pathname.startsWith('/_next') || pathname.includes('.') || pathname.startsWith('/static')) {
    return NextResponse.next()
  }

  // Protect dashboard if not logged in
  if (!token && isDashboard) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If logged in and trying to visit auth routes (except logout), redirect to dashboard
  if (token && isAuthPath && !pathname.startsWith('/auth/logout')) {
    const dashboardUrl = req.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}
