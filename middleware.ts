import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  // Handle NextAuth session requests
  if (request.nextUrl.pathname.startsWith('/api/auth') || 
      request.nextUrl.pathname === '/api/auth/session') {
    return NextResponse.next();
  }

  // Handle redirects from /login to /auth/login
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Handle the incorrect upload path format
  if (request.nextUrl.pathname.startsWith('/upload/arbtation')) {
    
    // Extract the filename or subpath
    const relativePath = request.nextUrl.pathname.replace(/^\/upload\/arbtation/, '');
    
    // Redirect to the correct path
    const correctUrl = new URL(`/api/uploads/arbitration${relativePath}`, request.url);
    
    return NextResponse.redirect(correctUrl);
  }

  return NextResponse.next()
}

// Configure which paths this middleware will run on
export const config = {
  matcher: [
    // Apply to these paths
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Include NextAuth paths
    '/api/auth/:path*',
    '/api/auth/session',
    // Also include the incorrect upload path
    '/upload/arbtation/:path*',
  ],
} 