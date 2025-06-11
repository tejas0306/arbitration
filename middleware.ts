import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  // Handle NextAuth session requests
  if (request.nextUrl.pathname.startsWith('/api/auth') || 
      request.nextUrl.pathname === '/api/auth/session') {
    console.log('NextAuth request:', request.nextUrl.pathname);
    return NextResponse.next();
  }

  // Handle redirects from /login to /auth/login
  if (request.nextUrl.pathname === '/login') {
    console.log('Redirecting from /login to /auth/login');
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth_token')?.value;
    
    // If no token, redirect to login
    if (!token) {
      console.log('No auth token found, redirecting to login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // Check if user data exists in localStorage via cookies
    const userCookie = request.cookies.get('user_data')?.value;
    
    // If we have user data and they're not an admin, redirect to dashboard
    if (userCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(userCookie));
        if (userData.role !== 'ADMIN') {
          console.log('User is not an admin, redirecting to dashboard');
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } catch (error) {
        console.error('Error parsing user cookie:', error);
        // If we can't parse the cookie, let the protected route component handle it
      }
    }
    
    // For authenticated users, let the ProtectedRoute component handle the detailed role check
    console.log('Allowing admin route access, role will be checked by component');
    return NextResponse.next();
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
    // Apply to these paths
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Include NextAuth paths
    '/api/auth/:path*',
    '/api/auth/session',
    // Also include the incorrect upload path
    '/upload/arbtation/:path*',
    // Protect admin routes
    '/admin/:path*',
  ],
} 