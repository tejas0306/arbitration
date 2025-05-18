// Mock API route to handle specific draft ID routes
import { NextResponse } from 'next/server';
import { mockDrafts } from '@/lib/mock-data';

export async function GET(req, { params }) {
  const { id } = params;
  console.log(`🔶 Mock API - Getting draft with ID: ${id}`);
  
  // Find the draft with the given ID
  const draft = mockDrafts.find(d => d.id === id);
  
  if (!draft) {
    console.log(`🔶 Mock API - Draft not found with ID: ${id}`);
    return NextResponse.json(
      { error: 'Draft not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(draft);
}

export async function PUT(req, { params }) {
  const { id } = params;
  console.log(`🔶 Mock API - Updating draft with ID: ${id}`);
  
  try {
    // Parse the request body
    const data = await req.formData();
    const jsonData = data.get('data');
    
    // Find the draft index
    const index = mockDrafts.findIndex(d => d.id === id);
    
    if (index === -1) {
      console.log(`🔶 Mock API - Draft not found with ID: ${id}`);
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }
    
    // Update the draft
    mockDrafts[index] = {
      ...mockDrafts[index],
      data: jsonData ? JSON.parse(jsonData) : mockDrafts[index].data,
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(mockDrafts[index]);
  } catch (error) {
    console.error('🔶 Mock API - Error updating draft:', error);
    return NextResponse.json(
      { error: 'Error updating draft', message: error.message },
      { status: 500 }
    );
  }
} 