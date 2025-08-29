import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    console.log('🔍 API Route: Counter-response-data endpoint called');
    
    // Get auth token from request headers (set by the frontend)
    const authHeader = request.headers.get('authorization');
    console.log('🔍 API Route: Auth header exists:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔍 API Route: No valid auth header');
      return NextResponse.json({ error: 'Authentication token required' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const caseId = params.caseId;
    console.log('🔍 API Route: Case ID:', caseId);
    console.log('🔍 API Route: Token length:', token.length);
    
    // Use the existing case endpoint instead of the new counter-response-data endpoint
    const apiUrl = getApiUrl(`api/arbitration/cases/${caseId}`);
    console.log('🔍 API Route: Backend URL:', apiUrl);
    
    console.log(`Fetching case data from backend: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🔍 API Route: Backend response status:', response.status);
    
    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      const errorData = await response.text();
      console.error('Backend error:', errorData);
      
      if (response.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      if (response.status === 403) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      if (response.status === 404) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
      }
      
      return NextResponse.json(
        { error: `Failed to fetch case data: ${response.status}` },
        { status: response.status }
      );
    }
    
    const caseData = await response.json();
    
    console.log('Successfully fetched case data from backend');
    console.log('🔍 API Route: Case data keys:', Object.keys(caseData));
    
    // Transform the case data into the format expected by the frontend
    const responseData = {
      id: caseData.id,
      caseNumber: caseData.caseNumber || caseData.id,
      status: caseData.status,
      originalData: {
        title: caseData.name || 'Untitled Case',
        description: caseData.disputeDetails || {},
        disputeType: (caseData.disputeDetails as any)?.disputeType || 'Not specified',
        disputeAmount: (caseData.disputeDetails as any)?.disputeAmount || 'Not specified',
        claimant: {
          name: caseData.user?.name || 'Unknown',
          email: caseData.user?.email || 'Unknown'
        },
        respondents: caseData.respondents || [],
        documents: caseData.documents || {},
        createdAt: caseData.createdAt
      },
      respondentResponses: [], // Will be populated when responses are implemented
      respondentIssues: [], // Will implement AI judgments later
      hasCounterResponse: false, // Will be determined based on actual responses
      counterResponseDeadline: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(), // Default 7 days from now
      currentRound: null // Will implement workflow rounds later
    };
    
    console.log('🔍 API Route: Returning transformed data');
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error fetching counter-response data:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
