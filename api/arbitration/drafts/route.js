// Mock API route to handle arbitration drafts list request (plural endpoint)
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export async function GET(req) {
  console.log('🔶 Next.js API - Getting all drafts');
  
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
    const backendUrl = `${API_URL}/api/arbitration/drafts`;
    console.log(`🔶 Next.js API - Forwarding to: ${backendUrl}`);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!backendResponse.ok) {
      console.log(`🔶 Next.js API - Backend response error: ${backendResponse.status}`);
      const errorText = await backendResponse.text();
      console.log(`🔶 Next.js API - Backend error details: ${errorText}`);
      
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.status}`, details: errorText },
        { status: backendResponse.status }
      );
    }
    
    const draftsData = await backendResponse.json();
    console.log(`🔶 Next.js API - Successfully retrieved ${draftsData.length || 0} drafts from backend`);
    
    return NextResponse.json(draftsData);
    
  } catch (error) {
    console.error('🔶 Next.js API - Error getting drafts:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  console.log('🔶 Next.js API - Saving draft');
  
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
    const backendUrl = `${API_URL}/api/arbitration/draft`;
    console.log(`🔶 Next.js API - Forwarding draft save to: ${backendUrl}`);
    
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
      console.log(`🔶 Next.js API - Backend save error: ${backendResponse.status}`);
      const errorText = await backendResponse.text();
      console.log(`🔶 Next.js API - Backend error details: ${errorText}`);
      
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.status}`, details: errorText },
        { status: backendResponse.status }
      );
    }
    
    const savedDraft = await backendResponse.json();
    console.log(`🔶 Next.js API - Successfully saved draft via backend`);
    
    return NextResponse.json(savedDraft);
    
  } catch (error) {
    console.error('🔶 Next.js API - Error saving draft:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
} 