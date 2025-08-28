import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const caseId = params.caseId
    
    if (!caseId) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 })
    }

    // Get auth token from cookies or headers
    let authToken = request.cookies.get('respondent-session')?.value || 
                   request.cookies.get('auth-token')?.value ||
                   request.cookies.get('next-auth.session-token')?.value || undefined
    
    // If no cookie, try Authorization header as fallback
    if (!authToken) {
      const headerAuth = request.headers.get('authorization')
      if (headerAuth && headerAuth.startsWith('Bearer ')) {
        authToken = headerAuth.substring(7)
      }
    }
    
    if (!authToken) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 })
    }

    // Call backend API to get case details
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/arbitration/cases/${caseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      console.log(`🔧 Backend case details API failed: ${response.status}`)
      return NextResponse.json({ error: 'Failed to fetch case details' }, { status: response.status })
    }
    
    const caseData = await response.json()
    return NextResponse.json(caseData)
    
  } catch (error) {
    console.error('Error fetching case details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
