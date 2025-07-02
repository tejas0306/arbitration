import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export async function GET(req) {
  
  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
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
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'authorization': authHeader,
        'content-type': 'application/json',
      },
    });
    
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { error: 'Failed to fetch arbitrators' },
        { status: backendResponse.status }
      );
    }
    
    const data = await backendResponse.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 