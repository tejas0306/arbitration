import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const caseId = params.id;
    
    // Get the case
    const caseData = await prisma.arbitration.findUnique({
      where: { id: caseId }
    });

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Check if user is authorized to view
    const isClaimant = caseData.userId === user.id;
    const isRespondent = caseData.respondents && 
      Array.isArray(caseData.respondents) && 
      caseData.respondents.some((resp: any) => resp.email === user.email);
    const isArbitrator = user.role === 'ARBITRATOR' && caseData.arbitratorId === user.id;
    const isAdmin = user.role === 'ADMIN';
    
    if (!isClaimant && !isRespondent && !isArbitrator && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to view arbitrator proposals for this case' },
        { status: 403 }
      );
    }
    
    // Get all proposals for the case
    const proposals = await prisma.arbitratorProposal.findMany({
      where: { caseId },
      include: {
        arbitrator: {
          select: {
            id: true,
            name: true,
            email: true,
            expertise: true,
            qualifications: true,
            experience: true,
          },
        },
        proposedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { sequence: 'desc' },
    });
    
    return NextResponse.json(proposals);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch arbitrator proposals' },
      { status: 500 }
    );
  }
} 