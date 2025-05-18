// Mock API route to handle draft submission
import { NextResponse } from 'next/server';
import { mockDrafts, mockCases } from '@/lib/mock-data';

export async function POST(req, { params }) {
  const { id } = params;
  console.log(`🔶 Mock API - Submitting draft with ID: ${id}`);
  
  // Find the draft with the given ID
  const draftIndex = mockDrafts.findIndex(d => d.id === id);
  
  if (draftIndex === -1) {
    console.log(`🔶 Mock API - Draft not found with ID: ${id}`);
    return NextResponse.json(
      { error: 'Draft not found' },
      { status: 404 }
    );
  }
  
  // Get the draft
  const draft = mockDrafts[draftIndex];
  
  // Create a case from the draft
  const newCase = {
    id: Math.random().toString(36).substring(2, 15),
    caseNumber: `ARB-${Math.floor(Math.random() * 10000)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: draft.data?.type || draft.type || 'Default Type',
    isDraft: false,
    data: draft.data,
  };
  
  // Add the case to the mock cases array
  mockCases.push(newCase);
  
  // Remove the draft
  mockDrafts.splice(draftIndex, 1);
  
  console.log(`🔶 Mock API - Draft submitted successfully, created case: ${newCase.caseNumber}`);
  
  return NextResponse.json({
    success: true,
    message: 'Draft submitted successfully',
    caseId: newCase.id,
    caseNumber: newCase.caseNumber
  });
} 