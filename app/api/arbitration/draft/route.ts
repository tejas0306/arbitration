import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getApiUrl } from '@/lib/config';

export const maxDuration = 300; // 5 minutes maximum execution time
export const dynamic = 'force-dynamic';

// Helper to get auth token from session or request
async function getAuthToken(req: NextRequest) {
  // Try to get token from session first
  const session = await getServerSession(authOptions as any);
  
  if (session?.accessToken) {
    return session.accessToken as string;
  }
  
  // Fall back to auth header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

export async function POST(req: NextRequest) {
  try {
    console.log('Arbitration draft API route handler called');
    
    // Get authentication token
    const token = await getAuthToken(req);
    
    if (!token) {
      console.error('Authentication required');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse form data
    const formData = await req.formData();
    
    // Log form data keys for debugging
    console.log('Form data keys:', Array.from(formData.keys()));
    
    // Forward the request to the backend API
    const apiUrl = getApiUrl('api/arbitration/draft');
    console.log('Forwarding draft request to backend:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header as it will be set automatically with the boundary
      },
      body: formData,
    });
    
    // Read the response
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Backend API error:', responseData);
      return NextResponse.json(
        { error: responseData.message || 'Failed to save draft' },
        { status: response.status }
      );
    }
    
    console.log('Draft saved successfully:', responseData);
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('Error in arbitration draft API route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 