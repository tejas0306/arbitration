import { NextRequest, NextResponse } from 'next/server';

// Direct proxy to the backend API for file access using the correct path
export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    
    // Extract the relative path from /api/uploads/...
    const relativePath = path.replace(/^\/api\/uploads/, '');
    
    // Build the backend URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const targetUrl = `${backendUrl}/uploads${relativePath}`;
    
    
    // Forward the request to the backend API
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
    });
    
    // If the response is not ok, log the error
    if (!response.ok) {
      return new Response(`Backend API returned error: ${response.status} ${response.statusText}`, {
        status: response.status,
      });
    }
    
    // Get the response body
    const data = await response.arrayBuffer();
    
    // Return the response with the same headers
    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error proxying to backend API', details: error.message },
      { status: 500 }
    );
  }
} 