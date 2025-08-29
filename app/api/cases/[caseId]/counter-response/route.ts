import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    // Check authentication using NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const caseId = params.caseId;
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get case data to verify it exists
    const caseData = await prisma.arbitration.findUnique({
      where: { id: caseId }
    });

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { counterResponses, issueResponses } = body;

    // Create a new case response for the counter-response
    const counterResponse = await prisma.caseResponse.create({
      data: {
        caseId,
        respondentId: user.id,
        status: 'SUBMITTED',
        responseOverview: 'Counter-response submitted by claimant',
        submittedAt: new Date()
      }
    });

    // Update case status
    await prisma.arbitration.update({
      where: { id: caseId },
      data: {
        status: 'COUNTER_RESPONSE_SUBMITTED',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Counter-response submitted successfully',
      counterResponseId: counterResponse.id,
      nextStep: 'AI judgment will be generated within 3 days'
    });

  } catch (error) {
    console.error('Error submitting counter-response:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
