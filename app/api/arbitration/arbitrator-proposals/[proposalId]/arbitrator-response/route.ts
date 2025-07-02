import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    
    // Verify user is an arbitrator
    if (user.role !== 'ARBITRATOR') {
      return NextResponse.json(
        { error: 'Only arbitrators can respond to assignments' },
        { status: 403 }
      );
    }
    
    const proposalId = params.proposalId;
    const body = await request.json();
    const { accepted, notes, disclosureDocuments } = body;
    
    if (accepted === undefined) {
      return NextResponse.json(
        { error: 'Acceptance status is required' },
        { status: 400 }
      );
    }
    
    // Get the proposal
    const proposal = await prisma.arbitratorProposal.findUnique({
      where: { id: proposalId },
      include: {
        case: true,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }
    
    // Verify the arbitrator is the one assigned to this proposal
    if (proposal.arbitratorId !== user.id) {
      return NextResponse.json(
        { error: 'You are not the arbitrator for this proposal' },
        { status: 403 }
      );
    }
    
    // Verify the proposal has been accepted by both parties
    if (proposal.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'This proposal has not been accepted by both parties' },
        { status: 400 }
      );
    }
    
    // Verify the arbitrator hasn't already responded
    if (proposal.arbitratorAccepted !== null) {
      return NextResponse.json(
        { error: 'You have already responded to this assignment' },
        { status: 400 }
      );
    }
    
    // If the arbitrator is accepting, disclosure documents are required
    if (accepted && (!disclosureDocuments || 
        (Array.isArray(disclosureDocuments) && disclosureDocuments.length === 0) && 
        (!Object.keys(disclosureDocuments).length))) {
      return NextResponse.json(
        { error: 'Disclosure documents are required when accepting an assignment' },
        { status: 400 }
      );
    }
    
    // Update the proposal
    const updatedProposal = await prisma.arbitratorProposal.update({
      where: { id: proposalId },
      data: {
        arbitratorAccepted: accepted,
        arbitratorResponseAt: new Date(),
        arbitratorNotes: notes,
        disclosureDocuments: disclosureDocuments,
      },
    });
    
    // Update the case based on the arbitrator's response
    if (accepted) {
      // Create a case assignment (if using this model)
      try {
        await prisma.caseAssignment.create({
          data: {
            caseId: proposal.caseId,
            arbitratorId: user.id,
            status: 'ACCEPTED',
            notes: notes,
            respondedAt: new Date(),
          },
        });
      } catch (error) {
        // Continue execution even if this fails
      }
      
      // Update case status
      await prisma.arbitration.update({
        where: { id: proposal.caseId },
        data: {
          status: 'ARBITRATOR_ASSIGNED',
          arbitratorId: user.id, // Link the arbitrator directly to the case
        },
      });
    } else {
      // If the arbitrator rejected, reset the selection process
      await prisma.arbitration.update({
        where: { id: proposal.caseId },
        data: {
          status: 'ARBITRATOR_REJECTED',
          arbitratorSelectionStatus: 'in_progress',
          currentProposerRole: 'CLAIMANT', // Reset to claimant's turn
        },
      });
    }
    
    return NextResponse.json(updatedProposal);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process arbitrator response' },
      { status: 500 }
    );
  }
} 