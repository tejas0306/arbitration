import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle redirects from /login to /auth/login
  if (request.nextUrl.pathname === '/login') {
    console.log('Redirecting from /login to /auth/login');
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

// Configure which paths this middleware will run on
export const config = {
  matcher: [
    // Apply to all paths
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 