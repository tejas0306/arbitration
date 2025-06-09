import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug API route called');
    
    // Get all cookies for debugging
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    const cookieNames = allCookies.map(c => c.name);
    
    // Check for next-auth session cookie
    const hasNextAuthCookie = cookieNames.some(name => name.startsWith('next-auth.session-token'));
    
    // Get the session using NextAuth
    const session = await getServerSession(authOptions);
    
    // Return debug information
    return NextResponse.json({
      hasSession: !!session,
      sessionData: session,
      cookies: {
        count: allCookies.length,
        names: cookieNames,
        hasNextAuthSessionCookie: hasNextAuthCookie,
      },
      headers: {
        authorization: request.headers.get('authorization'),
        cookie: request.headers.get('cookie'),
      }
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    return NextResponse.json(
      { error: 'Debug route error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 