import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { caseNumber: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const accessCode = searchParams.get('code');
    const encryptedCaseNumber = params.caseNumber;

    if (!accessCode) {
      return NextResponse.json(
        { error: 'Access code required' },
        { status: 401 }
      );
    }

    // Decrypt case number
    const caseNumber = decryptCaseNumber(encryptedCaseNumber);
    
    if (!caseNumber) {
      return NextResponse.json(
        { error: 'Invalid case number' },
        { status: 400 }
      );
    }

    // Call backend API to get case data with access code verification
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${backendUrl}/api/cases/public/${caseNumber}?code=${accessCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid access code' },
          { status: 401 }
        );
      }
      throw new Error('Failed to fetch case data');
    }

    const caseData = await response.json();

    // Format the response for frontend
    const formattedData = {
      id: caseData.id,
      caseNumber: caseData.caseNumber,
      claimantName: caseData.claimantName || 'Unknown',
      submissionDate: caseData.createdAt,
      responseDeadline: caseData.responseDeadline,
      status: caseData.status,
      petitionData: caseData.petitionData || {},
      respondentInfo: {
        name: caseData.respondentName || 'Unknown',
        email: caseData.respondentEmail || '',
        hasResponded: caseData.hasResponded || false,
      }
    };

    return NextResponse.json(formattedData);
    
  } catch (error) {
    console.error('Error fetching public case data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to decrypt case number
function decryptCaseNumber(encryptedCaseNumber: string): string | null {
  try {
    // Simple base64 decoding - replace with proper decryption in production
    const decoded = Buffer.from(encryptedCaseNumber, 'base64').toString('utf-8');
    return decoded;
  } catch {
    return null;
  }
}
