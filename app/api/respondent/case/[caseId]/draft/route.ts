import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    // Extract case ID from dynamic route - decode if it contains encoded slashes
    const caseId = decodeURIComponent(params.caseId)
    
    if (!caseId) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 })
    }

    // Get auth token from cookie (respondent session)
    let authToken = request.cookies.get('respondent-session')?.value
    console.log('🔧 Draft - Cookie auth token:', authToken ? 'Present' : 'Missing')
    
    if (!authToken) {
      console.log('🔧 Draft - ERROR: No authorization token found in cookies')
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 })
    }

    const body = await request.json()

    // Proxy to backend for saving draft
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/respondent/cases/${encodeURIComponent(caseId)}/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(errorData, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error in respondent case draft route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract case ID from dynamic route - decode if it contains encoded slashes
    const caseId = decodeURIComponent(params.caseId)
    
    if (!caseId) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 })
    }

    // Proxy to backend for retrieving draft
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/respondent/cases/${encodeURIComponent(caseId)}/draft`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'user-id': session.user.id || '',
        'user-role': session.user.role || 'RESPONDENT',
        'user-email': session.user.email || '',
        'Authorization': `Bearer ${session.accessToken || ''}`,
      },
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(errorData, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error in respondent case draft route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}