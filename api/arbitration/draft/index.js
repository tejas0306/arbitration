// Mock API route to handle arbitration draft requests in development mode
// This serves as a fallback when the backend service isn't available

import { NextResponse } from 'next/server';
import { mockDrafts } from '@/lib/mock-data';

// Add a test draft if array is empty
if (mockDrafts.length === 0) {
  mockDrafts.push({
    id: 'test-draft-123',
    title: 'Test Draft',
    type: 'Commercial',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDraft: true,
    data: {
      type: 'Commercial',
      name: 'Test Company',
      disputeDetails: {
        disputeType: 'Commercial',
        disputeAmount: '100000',
        disputeDescription: 'Test dispute for development',
      }
    }
  });
  console.log('🔶 Added test draft for development');
}

// Store drafts in memory (will be reset on server restart)
const saveMockDraft = (draft) => {
  // Generate an ID if not present
  if (!draft.id) {
    draft.id = `draft-${Date.now()}`;
  }
  
  // Check if this draft already exists
  const existingIndex = mockDrafts.findIndex(d => d.id === draft.id);
  
  if (existingIndex >= 0) {
    // Update existing
    mockDrafts[existingIndex] = {
      ...mockDrafts[existingIndex],
      ...draft,
      updatedAt: new Date().toISOString()
    };
    return mockDrafts[existingIndex];
  } else {
    // Add new draft
    const newDraft = {
      ...draft,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: draft.data?.type || 'Default Type',
      isDraft: true
    };
    mockDrafts.push(newDraft);
    return newDraft;
  }
};

export async function GET(req) {
  console.log('🔶 Mock API - Getting all drafts');
  console.log(`🔶 Current mock drafts: ${mockDrafts.length}`);
  
  // Return mock data
  return NextResponse.json(mockDrafts);
}

export async function POST(req) {
  console.log('🔶 Mock API - Saving draft');
  
  try {
    // Parse the request body
    const formData = await req.formData();
    let id = formData.get('id');
    const jsonData = formData.get('data');
    
    console.log(`🔶 Got form data - ID: ${id}, Data: ${jsonData ? 'present' : 'missing'}`);
    
    // Create a draft object
    const draftData = { 
      id: id || undefined,
      data: jsonData ? JSON.parse(jsonData) : {},
    };
    
    // Save the draft
    const savedDraft = saveMockDraft(draftData);
    
    console.log('🔶 Mock API - Draft saved:', savedDraft.id);
    
    // Return the saved draft
    return NextResponse.json(savedDraft);
  } catch (error) {
    console.error('🔶 Mock API - Error saving draft:', error);
    return NextResponse.json(
      { error: 'Error saving draft', message: error.message },
      { status: 500 }
    );
  }
} 