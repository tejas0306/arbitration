// Mock API route to handle specific draft ID routes
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export async function GET(req, { params }) {
  const { id } = params;
  console.log(`🔶 Next.js API - Getting draft with ID: ${id}`);
  
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
    const backendUrl = `${API_URL}/api/arbitration/draft/${id}`;
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
    
    const draftData = await backendResponse.json();
    console.log(`🔶 Next.js API - Successfully retrieved draft from backend`);
    console.log(`🔶 Next.js API - Draft data keys:`, Object.keys(draftData));
    
    // Log if formData is present
    if (draftData.formData) {
      console.log(`🔶 Next.js API - Draft has formData structure`);
    } else {
      console.log(`🔶 Next.js API - Draft using legacy flattened structure`);
    }
    
    return NextResponse.json(draftData);
    
  } catch (error) {
    console.error('🔶 Next.js API - Error getting draft:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  const { id } = params;
  console.log(`🔶 Next.js API - Updating draft with ID: ${id}`);
  
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
    console.log(`🔶 Next.js API - Forwarding update to: ${backendUrl}`);
    
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
      console.log(`🔶 Next.js API - Backend update error: ${backendResponse.status}`);
      const errorText = await backendResponse.text();
      console.log(`🔶 Next.js API - Backend error details: ${errorText}`);
      
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.status}`, details: errorText },
        { status: backendResponse.status }
      );
    }
    
    const updatedDraft = await backendResponse.json();
    console.log(`🔶 Next.js API - Successfully updated draft via backend`);
    
    return NextResponse.json(updatedDraft);
    
  } catch (error) {
    console.error('🔶 Next.js API - Error updating draft:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
} 