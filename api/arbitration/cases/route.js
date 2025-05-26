// API route to handle arbitration cases with proper authentication
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export async function GET(req) {
  console.log('🔶🔶🔶 CASES API ROUTE HIT - Getting user-specific cases 🔶🔶🔶');
  console.log('🔶 Request URL:', req.url);
  console.log('🔶 Request method:', req.method);
  console.log('🔶 API_URL env var:', API_URL);
  
  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      console.log('🔶 Cases API - No authorization header found');
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }
    
    // Forward the request to the NestJS backend
    const backendUrl = `${API_URL}/arbitration/cases`;
    console.log(`🔶 Cases API - Forwarding to: ${backendUrl}`);
    console.log('🔶 Cases API - Auth header present:', !!authHeader);
    console.log('🔶 Cases API - Auth header value:', authHeader?.substring(0, 20) + '...');
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`🔶 Cases API - Backend response status: ${backendResponse.status}`);
    
    if (!backendResponse.ok) {
      console.log(`🔶 Cases API - Backend response error: ${backendResponse.status}`);
      const errorText = await backendResponse.text();
      console.log(`🔶 Cases API - Backend error details: ${errorText}`);
      
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.status}`, details: errorText },
        { status: backendResponse.status }
      );
    }
    
    const casesData = await backendResponse.json();
    console.log(`🔶 Cases API - Successfully retrieved ${casesData.length || 0} cases for authenticated user`);
    console.log('🔶 Cases API - Cases data preview:', casesData.slice(0, 2).map(c => ({ id: c.id, claimantId: c.claimantId, respondentId: c.respondentId })));
    
    return NextResponse.json(casesData);
    
  } catch (error) {
    console.error('🔶 Cases API - Error getting cases:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
} 