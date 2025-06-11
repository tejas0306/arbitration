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
    
    // Try to get user data from token to check role
    try {
      // This is a basic check - a more robust solution would verify the token
      // against your backend API using the getCurrentUser endpoint
      
      // For now, check if user data exists in localStorage
      // Note: This is client-side and we can't access it in middleware
      // You'd need to implement a server-side token verification solution
      
      // Since we can't do this fully in middleware, we'll let the ProtectedRoute
      // component handle the detailed role check, but this gives basic protection
      
      console.log('Allowing admin route access, role will be checked by component');
      return NextResponse.next();
      
    } catch (error) {
      console.error('Error checking admin access:', error);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
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