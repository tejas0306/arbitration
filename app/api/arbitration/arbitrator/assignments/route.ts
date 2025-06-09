import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
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
    
    // Verify user is an arbitrator
    if (user.role !== 'ARBITRATOR') {
      return NextResponse.json(
        { error: 'Only arbitrators can view assignments' },
        { status: 403 }
      );
    }
    
    // Get pending assignments (proposals that have been accepted by both parties but not by arbitrator)
    const assignments = await prisma.arbitratorProposal.findMany({
      where: {
        arbitratorId: user.id,
        status: 'ACCEPTED',
        arbitratorAccepted: null, // Not yet responded to
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            name: true,
            type: true,
            disputeDetails: true,
            status: true,
            createdAt: true,
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
    });
    
    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching arbitrator assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arbitrator assignments' },
      { status: 500 }
    );
  }
} 