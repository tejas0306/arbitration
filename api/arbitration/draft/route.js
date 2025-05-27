// API route to handle arbitration draft requests with proper authentication
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export async function GET(req) {
  console.log('🔶 Draft API - Getting user-specific drafts');
  
  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      console.log('🔶 Draft API - No authorization header found');
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }
    
    // Forward the request to the NestJS backend
    const backendUrl = `${API_URL}/arbitration/draft`;
    console.log(`🔶 Draft API - Forwarding to: ${backendUrl}`);
    console.log('🔶 Draft API - Auth header present:', !!authHeader);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!backendResponse.ok) {
      console.log(`🔶 Draft API - Backend response error: ${backendResponse.status}`);
      const errorText = await backendResponse.text();
      console.log(`🔶 Draft API - Backend error details: ${errorText}`);
      
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.status}`, details: errorText },
        { status: backendResponse.status }
      );
    }
    
    const draftsData = await backendResponse.json();
    console.log(`🔶 Draft API - Successfully retrieved ${draftsData.length || 0} drafts for authenticated user`);
    
    return NextResponse.json(draftsData);
    
  } catch (error) {
    console.error('🔶 Draft API - Error getting drafts:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  console.log('🔶 Draft API - Saving draft');
  
  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      console.log('🔶 Draft API - No authorization header found');
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }
    
    // Forward the request to the NestJS backend
    const backendUrl = `${API_URL}/arbitration/draft`;
    console.log(`🔶 Draft API - Forwarding draft save to: ${backendUrl}`);
    
    // Get the request body (FormData)
    const formData = await req.formData();
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      },
      body: formData
    });
    
    if (!backendResponse.ok) {
      console.log(`🔶 Draft API - Backend save error: ${backendResponse.status}`);
      const errorText = await backendResponse.text();
      console.log(`🔶 Draft API - Backend error details: ${errorText}`);
      
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.status}`, details: errorText },
        { status: backendResponse.status }
      );
    }
    
    const savedDraft = await backendResponse.json();
    console.log(`🔶 Draft API - Successfully saved draft via backend`);
    
    return NextResponse.json(savedDraft);
    
  } catch (error) {
    console.error('🔶 Draft API - Error saving draft:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
} 