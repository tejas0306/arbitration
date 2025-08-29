import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    return NextResponse.json({
      message: 'Test endpoint working',
      hasAuthHeader: !!authHeader,
      authHeaderType: authHeader ? typeof authHeader : 'none',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
