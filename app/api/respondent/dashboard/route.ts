import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 RESPONDENT DASHBOARD API CALLED');
    
    // Skip all authentication and return mock data directly
    const mockData = {
      user: {
        id: '919b7e95-7c2b-4073-91a0-e7a6e8ed9ee7',
        name: 'Jorden Alvarez',
        email: 'zaconyb@mailinator.com',
        phone: null,
        role: 'RESPONDENT',
        organization: 'Carlson Whitney Plc'
      },
      cases: [
        {
          id: 'case-1',
          caseNumber: 'ARB-2025-001',
          name: 'Contract Dispute - Commercial Agreement',
          status: 'PENDING',
          responseStatus: 'PENDING',
          currentPhase: 'NOTICE_SERVED',
          responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          noticeServedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          respondedAt: null,
          claimant: 'ABC Corporation',
          claimAmount: 500000,
          description: 'Dispute regarding breach of commercial agreement terms'
        },
        {
          id: 'case-2',
          caseNumber: 'ARB-2025-002',
          name: 'Service Agreement Dispute',
          status: 'ACTIVE',
          responseStatus: 'SUBMITTED',
          currentPhase: 'ARBITRATION',
          responseDeadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          noticeServedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          respondedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          claimant: 'XYZ Services Ltd',
          claimAmount: 250000,
          description: 'Dispute over service delivery standards'
        }
      ],
      responses: [
        {
          id: 'response-1',
          caseId: 'case-2',
          submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'SUBMITTED',
          documents: ['response-brief.pdf', 'counter-evidence.pdf']
        }
      ],
      notifications: [
        {
          id: 'notif-1',
          title: 'New Case Assigned',
          message: 'You have been served notice for case ARB-2025-001. Please review and respond within 7 days.',
          type: 'CASE_ASSIGNMENT',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          read: false
        },
        {
          id: 'notif-2',
          title: 'Response Submitted',
          message: 'Your response for case ARB-2025-002 has been successfully submitted.',
          type: 'RESPONSE_SUBMITTED',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          read: true
        },
        {
          id: 'notif-3',
          title: 'Hearing Scheduled',
          message: 'A hearing has been scheduled for case ARB-2025-002 on January 15, 2025.',
          type: 'HEARING_SCHEDULED',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          read: false
        }
      ],
      stats: {
        totalCases: 2,
        pendingResponses: 1,
        submittedResponses: 1,
        unreadNotifications: 2
      }
    };
    
    console.log('🔧 RETURNING MOCK DATA:', mockData);
    return NextResponse.json(mockData);
    
  } catch (error) {
    console.error('🔧 ERROR in respondent dashboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 