import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
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
    const body = await request.json();
    const { arbitratorId, notes } = body;
    
    if (!arbitratorId) {
      return NextResponse.json({ error: 'Arbitrator ID is required' }, { status: 400 });
    }
    
    // Get the case
    const caseData = await prisma.arbitration.findUnique({
      where: { id: caseId },
      include: {
        arbitratorProposals: {
          orderBy: { sequence: 'desc' },
          take: 1,
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Check if user is authorized to propose
    const isClaimant = caseData.userId === user.id;
    const isRespondent = caseData.respondents && 
      Array.isArray(caseData.respondents) && 
      caseData.respondents.some((resp: any) => resp.email === user.email);
    const isAdmin = user.role === 'ADMIN';
    
    if (!isClaimant && !isRespondent && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to propose arbitrators for this case' },
        { status: 403 }
      );
    }
    
    // Determine proposer role
    let proposerRole;
    if (isAdmin) {
      proposerRole = 'ADMIN';
    } else if (isClaimant) {
      proposerRole = 'CLAIMANT';
    } else if (isRespondent) {
      proposerRole = 'RESPONDENT';
    }
    
    // Validate turn-based flow (first proposal must come from claimant)
    if (caseData.arbitratorProposals.length === 0 && proposerRole !== 'CLAIMANT' && !isAdmin) {
      return NextResponse.json(
        { error: 'The first arbitrator proposal must come from the claimant' },
        { status: 400 }
      );
    }
    
    // If there are existing proposals, check whose turn it is
    if (caseData.arbitratorProposals.length > 0 && !isAdmin) {
      const lastProposal = caseData.arbitratorProposals[0];
      
      // If the last proposal is pending, other party cannot propose
      if (lastProposal.status === 'PENDING') {
        return NextResponse.json(
          { error: 'There is already a pending arbitrator proposal' },
          { status: 400 }
        );
      }
      
      // Check if it's the right party's turn
      if (lastProposal.proposerRole === 'CLAIMANT' && proposerRole === 'CLAIMANT') {
        return NextResponse.json(
          { error: "It's the respondent's turn to propose an arbitrator" },
          { status: 400 }
        );
      }
      
      if (lastProposal.proposerRole === 'RESPONDENT' && proposerRole === 'RESPONDENT') {
        return NextResponse.json(
          { error: "It's the claimant's turn to propose an arbitrator" },
          { status: 400 }
        );
      }
    }
    
    // Verify the proposed arbitrator exists and is active
    const arbitrator = await prisma.user.findUnique({
      where: {
        id: arbitratorId,
        role: 'ARBITRATOR',
        status: 'active',
      },
    });

    if (!arbitrator) {
      return NextResponse.json(
        { error: 'Arbitrator not found or is not active' },
        { status: 404 }
      );
    }
    
    // Create the proposal
    const sequence = caseData.arbitratorProposals.length > 0 
      ? caseData.arbitratorProposals[0].sequence + 1 
      : 1;
    
    const proposal = await prisma.arbitratorProposal.create({
      data: {
        caseId,
        arbitratorId,
        proposedById: user.id,
        proposerRole,
        status: 'PENDING',
        sequence,
        responseNotes: notes,
      },
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
      },
    });
    
    // Update the case status
    await prisma.arbitration.update({
      where: { id: caseId },
      data: {
        arbitratorSelectionStatus: 'in_progress',
        currentProposerRole: proposerRole === 'CLAIMANT' ? 'RESPONDENT' : 'CLAIMANT',
      },
    });
    
    return NextResponse.json(proposal);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to propose arbitrator' },
      { status: 500 }
    );
  }
} 