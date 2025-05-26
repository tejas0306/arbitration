import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export async function GET(req, { params }) {
  const { id } = params;
  console.log(`🔶 Next.js API - Getting arbitrator details for ID: ${id}`);
  
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
    
    // Forward the request to the NestJS backend
    const backendUrl = `${API_URL}/api/arbitrators/${id}`;
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
        { error: 'Failed to fetch arbitrator details' },
        { status: backendResponse.status }
      );
    }
    
    const data = await backendResponse.json();
    console.log(`🔶 Next.js API - Successfully fetched arbitrator details for ${data.name}`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('🔶 Next.js API - Error fetching arbitrator details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 