import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = params.id;
    
    if (!caseId) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
    }
    
    // Get auth token from request headers (set by the frontend)
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication token required' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Forward the request to the backend API
    const apiUrl = getApiUrl(`api/arbitration/cases/${caseId}`);
    
    console.log(`Fetching case details from backend: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      const errorData = await response.text();
      console.error('Backend error:', errorData);
      
      return NextResponse.json(
        { error: `Failed to fetch case details: ${response.status}` },
        { status: response.status }
      );
    }
    
    const caseData = await response.json();
    
    console.log('Successfully fetched case data from backend');
    console.log('Case data structure:', {
      id: caseData?.id,
      hasClaimant: !!caseData?.claimant,
      hasRespondents: !!caseData?.respondents,
      hasArbitrationAgreement: !!caseData?.arbitrationAgreement,
      hasDisputeDetails: !!caseData?.disputeDetails,
      hasDocuments: !!caseData?.documents,
      topLevelFields: Object.keys(caseData || {})
    });
    
    return NextResponse.json(caseData);
  } catch (error: any) {
    console.error('Error fetching case details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 