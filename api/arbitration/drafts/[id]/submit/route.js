// Mock API route to handle submitting a specific draft
import { NextResponse } from 'next/server';
import { mockDrafts, mockCases } from '@/lib/mock-data';

export async function POST(req, { params }) {
  const { id } = params;
  
  // Find the draft with the given ID
  const draft = mockDrafts.find(d => d.id === id);
  
  if (!draft) {
    return NextResponse.json(
      { error: 'Draft not found' },
      { status: 404 }
    );
  }
  
  // Generate a case number
  const caseNumber = `ADDS/ARB/${new Date().getFullYear()}/${String(mockCases.length + 1).padStart(7, '0')}`;
  
  // Create a new case from the draft
  const newCase = {
    id: `case-${Date.now()}`,
    caseNumber,
    type: draft.type || 'Default',
    status: 'pending',
    createdAt: new Date().toISOString(),
    claimant: {
      name: draft.data?.claimant?.name || draft.data?.name || 'Unknown',
      email: draft.data?.claimant?.email || draft.data?.email || 'unknown@example.com'
    },
    respondent: {
      name: draft.data?.respondents?.[0]?.name || 'Unknown',
      email: draft.data?.respondents?.[0]?.email || 'unknown@example.com'
    },
    disputeAmount: draft.data?.disputeDetails?.disputeAmount || '0',
    disputeType: draft.data?.disputeDetails?.disputeType || 'Unknown',
    data: draft.data
  };
  
  // Add the new case to the mock cases
  mockCases.push(newCase);
  
  // Remove the draft from the mock drafts (optional)
  const draftIndex = mockDrafts.findIndex(d => d.id === id);
  if (draftIndex !== -1) {
    mockDrafts.splice(draftIndex, 1);
  }
  
  // Return the case ID and case number
  return NextResponse.json({
    success: true,
    message: 'Draft submitted successfully',
    caseId: newCase.id,
    caseNumber
  });
} 