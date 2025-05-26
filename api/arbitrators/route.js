import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export async function GET(req) {
  console.log('🔶 Next.js API - Getting all arbitrators');
  
  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      console.log('🔶 Next.js API - No authorization header found');
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }
    
    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    
    // Forward the request to the NestJS backend
    const backendUrl = `${API_URL}/api/arbitrators${queryString ? `?${queryString}` : ''}`;
    console.log(`🔶 Next.js API - Forwarding to: ${backendUrl}`);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'authorization': authHeader,
        'content-type': 'application/json',
      },
    });
    
    console.log(`🔶 Next.js API - Backend response status: ${backendResponse.status}`);
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.log('🔶 Next.js API - Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch arbitrators' },
        { status: backendResponse.status }
      );
    }
    
    const data = await backendResponse.json();
    console.log(`🔶 Next.js API - Successfully fetched ${data.length || 0} arbitrators`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('🔶 Next.js API - Error fetching arbitrators:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 