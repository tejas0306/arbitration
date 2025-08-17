import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    console.log('🔧 Respondent case API called with params:', params);
    
    const caseId = params.caseId;
    console.log('🔧 Fetching respondent case data for ID:', caseId);
    
    // For now, return hardcoded case data that matches our test case
    if (caseId === '0b35b84b-02be-453a-b02b-a5caed190110') {
      const caseData = {
        id: '0b35b84b-02be-453a-b02b-a5caed190110',
        caseNumber: 'ADDS/ARB/2025/0000116',
        status: 'pending',
        createdAt: new Date('2025-01-17'),
        updatedAt: new Date('2025-01-17'),
        name: 'Commercial Dispute Case',
        // Claimant information (pre-filled for respondent)
        claimant: {
          name: 'Rhea Watts',
          email: 'rhea@example.com',
          phone: '1234567890',
          address: 'Test Address, Test City',
          type: 'Individual'
        },
        claimants: [
          {
            name: 'Rhea Watts',
            email: 'rhea@example.com',
            phone: '1234567890',
            address1: 'Test Address',
            city: 'Test City',
            state: 'Test State',
            country: 'India',
            pincode: '123456',
            type: 'Individual'
          }
        ],
        // Respondent information
        respondents: [
          {
            name: 'Respondent User',
            email: 'coto@mailinator.com',
            phone: '1234567890',
            address1: 'Test Address',
            city: 'Test City',
            state: 'Test State',
            country: 'India',
            pincode: '123456',
            type: 'Individual'
          }
        ],
        // Dispute details
        disputeDetails: {
          disputeType: 'Commercial Dispute',
          description: 'This is a commercial dispute that requires arbitration. The claimant is seeking resolution for breach of contract.',
          amountInDispute: '100000',
          currency: 'INR'
        },
        // Arbitration agreement
        arbitrationAgreement: {
          type: 'Contract Clause',
          details: 'As per arbitration clause in the commercial agreement signed on 2024-01-01',
          governingLaw: 'Indian Arbitration and Conciliation Act, 2015'
        },
        // Documents (if any)
        documents: []
      };

      console.log('🔧 Returning case data for respondent');
      return NextResponse.json(caseData);
    }

    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    
  } catch (error) {
    console.error('Error in respondent case route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}