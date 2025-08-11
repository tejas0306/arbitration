import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string[] } }
) {
  try {
    // Handle catch-all route for case IDs with slashes
    const caseId = params.id.join('/');
    const sessionToken = request.cookies.get('respondent-session')?.value;

    console.log('🔧 API: Loading case with ID:', caseId);

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Proxy to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/respondent/cases/${encodeURIComponent(caseId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    const data = await response.json();
    
    console.log('🔧 API: Backend response:', data);
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Case fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string[] } }
) {
  try {
    // Handle catch-all route for case IDs with slashes
    const caseId = params.id.join('/');
    const sessionToken = request.cookies.get('respondent-session')?.value;
    const body = await request.json();

    console.log('🔧 API: Submitting response for case ID:', caseId);

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Proxy to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/respondent/cases/${encodeURIComponent(caseId)}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    console.log('🔧 API: Backend response for submit:', data);
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Case response submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 