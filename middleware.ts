import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  // Handle NextAuth session requests
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Handle redirects from /login to /auth/login
  if (request.nextUrl.pathname === '/login') {
    console.log('Redirecting from /login to /auth/login');
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Handle the incorrect upload path format
  if (request.nextUrl.pathname.startsWith('/upload/arbtation')) {
    console.log('Intercepting incorrect upload path:', request.nextUrl.pathname);
    
    // Extract the filename or subpath
    const relativePath = request.nextUrl.pathname.replace(/^\/upload\/arbtation/, '');
    
    // Redirect to the correct path
    const correctUrl = new URL(`/api/uploads/arbitration${relativePath}`, request.url);
    console.log('Redirecting to correct path:', correctUrl.pathname);
    
    return NextResponse.redirect(correctUrl);
  }

  return NextResponse.next()
}

// Configure which paths this middleware will run on
export const config = {
  matcher: [
    // Apply to all paths
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // Also include the incorrect upload path
    '/upload/arbtation/:path*',
  ],
} 