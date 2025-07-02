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
    
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '10';
    
    // Forward the request to the NestJS backend
    const backendUrl = `${API_URL}/api/admin/audit-logs?limit=${limit}`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.status}`, details: errorText },
        { status: backendResponse.status }
      );
    }
    
    const auditLogs = await backendResponse.json();
    
    return NextResponse.json(auditLogs);
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
} 