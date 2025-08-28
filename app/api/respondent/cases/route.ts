import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🚨🚨🚨 RESPONDENT CASES API ROUTE CALLED 🚨🚨🚨');
    
    // Get auth token from cookies or headers
    let authToken = request.cookies.get('respondent-session')?.value || 
                   request.cookies.get('auth-token')?.value ||
                   request.cookies.get('next-auth.session-token')?.value || undefined;
    
    console.log('🔧 Auth token:', authToken ? 'Present' : 'Missing');
    
    // If no cookie, try Authorization header as fallback
    if (!authToken) {
      const headerAuth = request.headers.get('authorization');
      if (headerAuth && headerAuth.startsWith('Bearer ')) {
        authToken = headerAuth.substring(7);
      }
      console.log('🔧 Header auth token:', authToken ? 'Present' : 'Missing');
    }
    
    if (!authToken) {
      console.log('🔧 No auth token found, returning empty array');
      return NextResponse.json([]);
    }

    console.log('🔧 Calling backend with token...');
    
    // Call backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/respondent/cases`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.log(`🔧 Backend case API failed: ${response.status}`);
      return NextResponse.json([]);
    }
    
    const cases = await response.json();
    console.log('🔧 Frontend API: Backend returned:', cases.length, 'cases');
    console.log('🔧 Frontend API: Cases data:', cases);
    return NextResponse.json(cases);
    
  } catch (error) {
    console.error('🔧 Error fetching respondent cases:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Frontend API POST /respondent/cases called for response submission')
    
    const body = await request.json()
    const { caseId, responseData, round } = body
    
    console.log('🔧 Case ID:', caseId)
    console.log('🔧 Response data:', responseData)
    console.log('🔧 Round:', round)

    if (!caseId) {
      console.log('🔧 ERROR: No case ID provided')
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 })
    }

    // Get auth token from cookie (respondent session)
    let authToken = request.cookies.get('respondent-session')?.value || undefined
    console.log('🔧 Cookie auth token:', authToken ? 'Present' : 'Missing')
    
    // If no cookie, try Authorization header as fallback
    if (!authToken) {
      const headerAuth = request.headers.get('authorization')
      if (headerAuth && headerAuth.startsWith('Bearer ')) {
        authToken = headerAuth.substring(7) // Remove 'Bearer ' prefix
      }
      console.log('🔧 Header auth token:', authToken ? 'Present' : 'Missing')
    }
    
    if (!authToken) {
      console.log('🔧 ERROR: No authorization token found in cookies or headers')
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 })
    }

    // Proxy to backend for submitting response
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const backendEndpoint = `${backendUrl}/api/respondent/cases/${encodeURIComponent(caseId)}/respond`
    console.log('🔧 Backend endpoint:', backendEndpoint)
    
    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ responseData, round })
    })
    
    console.log('🔧 Backend response status:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('🔧 Backend response error:', response.status, errorData)
      return NextResponse.json(errorData, { status: response.status })
    }
    
    const data = await response.json()
    console.log('🔧 Response submitted successfully:', data)
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Error in respondent cases POST route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
