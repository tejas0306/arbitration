import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ArbitratorProposalStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { proposalId: string } }
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
    
    const proposalId = params.proposalId;
    const body = await request.json();
    const { status, notes } = body;
    
    if (!status || !Object.values(ArbitratorProposalStatus).includes(status as ArbitratorProposalStatus)) {
      return NextResponse.json(
        { error: 'Valid status (ACCEPTED or REJECTED) is required' },
        { status: 400 }
      );
    }
    
    // Get the proposal
    const proposal = await prisma.arbitratorProposal.findUnique({
      where: { id: proposalId },
      include: {
        case: true,
        arbitrator: true,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }
    
    if (proposal.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This proposal has already been responded to' },
        { status: 400 }
      );
    }
    
    // Check if user is authorized to respond
    const isClaimant = proposal.case.userId === user.id;
    const isRespondent = proposal.case.respondents && 
      Array.isArray(proposal.case.respondents) && 
      proposal.case.respondents.some((resp: any) => resp.email === user.email);
    const isAdmin = user.role === 'ADMIN';
    
    if (!isClaimant && !isRespondent && !isAdmin) {
      return NextResponse.json(
        { error: 'You are not authorized to respond to this proposal' },
        { status: 403 }
      );
    }
    
    // Ensure the person responding is not the person who proposed
    if (proposal.proposedById === user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'You cannot respond to your own proposal' },
        { status: 400 }
      );
    }
    
    // Update the proposal
    const updatedProposal = await prisma.arbitratorProposal.update({
      where: { id: proposalId },
      data: {
        status: status as ArbitratorProposalStatus,
        respondedAt: new Date(),
        responseNotes: notes,
      },
      include: {
        arbitrator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        proposedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    // If the proposal was accepted, update case status
    if (status === 'ACCEPTED') {
      await prisma.arbitration.update({
        where: { id: proposal.caseId },
        data: {
          status: 'ARBITRATOR_SELECTION_COMPLETED',
          arbitratorSelectionStatus: 'completed',
        },
      });
      
      // TODO: Send notification to the arbitrator
    } else {
      // If rejected, update the case to indicate it's the other party's turn
      await prisma.arbitration.update({
        where: { id: proposal.caseId },
        data: {
          currentProposerRole: isClaimant ? 'CLAIMANT' : 'RESPONDENT',
        },
      });
    }
    
    return NextResponse.json(updatedProposal);
  } catch (error) {
    console.error('Error responding to arbitrator proposal:', error);
    return NextResponse.json(
      { error: 'Failed to respond to arbitrator proposal' },
      { status: 500 }
    );
  }
} 