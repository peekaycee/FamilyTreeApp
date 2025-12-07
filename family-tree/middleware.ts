import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('familytree_session')?.value
  const { pathname } = req.nextUrl

  const isAuthPath = pathname.startsWith('/auth')
  const isApi = pathname.startsWith('/api')
  const isDashboard = pathname.startsWith('/dashboard')

  // --- Prevent caching globally ---
  const response = NextResponse.next()
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
  )
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")

  // Allow API, _next, static
  if (isApi || pathname.startsWith('/_next') || pathname.includes('.') || pathname.startsWith('/static')) {
    return response
  }

  // SESSION EXPIRED
  if ((!token || token === "expired") && isDashboard) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = "/auth/login"
    return NextResponse.redirect(loginUrl)
  }

  // Prevent logged-in users from seeing auth routes (except logout)
  if (token && isAuthPath && !pathname.startsWith("/auth/logout")) {
    const dashboardUrl = req.nextUrl.clone()
    dashboardUrl.pathname = "/dashboard"
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}
