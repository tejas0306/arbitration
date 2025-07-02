import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT: Update an arbitrator's status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check admin role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    });
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const arbitratorId = params.id;
    
    // Check if arbitrator exists
    const existingArbitrator = await prisma.user.findUnique({
      where: { 
        id: arbitratorId,
        role: 'ARBITRATOR'
      }
    });
    
    if (!existingArbitrator) {
      return NextResponse.json({ error: 'Arbitrator not found' }, { status: 404 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate status
    if (!body.status || !['active', 'inactive', 'pending'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status value. Must be one of: active, inactive, pending' },
        { status: 400 }
      );
    }
    
    // Update the arbitrator's status
    const updatedArbitrator = await prisma.user.update({
      where: { id: arbitratorId },
      data: {
        status: body.status,
        // If activating, set additional fields if needed
        ...(body.status === 'active' && {
          // Fields to set when activating
        }),
        // If deactivating, set additional fields if needed
        ...(body.status === 'inactive' && {
          // Fields to set when deactivating
        })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });
    
    // Log the status change for audit purposes
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: `ARBITRATOR_STATUS_CHANGE_${body.status.toUpperCase()}`,
        details: JSON.stringify({
          arbitratorId,
          arbitratorName: existingArbitrator.name,
          previousStatus: existingArbitrator.status,
          newStatus: body.status,
          changedBy: user.email
        }),
        entityId: arbitratorId,
        entityType: 'USER'
      }
    });
    
    return NextResponse.json({
      message: `Arbitrator status updated to ${body.status}`,
      arbitrator: updatedArbitrator
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update arbitrator status' },
      { status: 500 }
    );
  }
} 