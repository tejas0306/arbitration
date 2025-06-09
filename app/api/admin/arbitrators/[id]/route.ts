import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch a specific arbitrator by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
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
    
    // Only admin or arbitrators themselves can view detailed info
    const isAdmin = user.role === 'ADMIN';
    const isSelf = user.id === params.id;
    
    if (!isAdmin && !isSelf) {
      // For non-admin users, limit the fields returned
      const arbitrator = await prisma.user.findUnique({
        where: {
          id: params.id,
          role: 'ARBITRATOR',
        },
        select: {
          id: true,
          name: true,
          email: true,
          expertise: true,
          qualifications: true,
          experience: true,
          location: true,
          rating: true,
          status: true,
        },
      });
      
      if (!arbitrator) {
        return NextResponse.json({ error: 'Arbitrator not found' }, { status: 404 });
      }
      
      return NextResponse.json(arbitrator);
    }
    
    // For admins and self, return full details
    const arbitrator = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: 'ARBITRATOR',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        expertise: true,
        qualifications: true,
        experience: true,
        bio: true,
        pastExperience: true,
        languages: true,
        location: true,
        hourlyRate: true,
        availabilityInfo: true,
        status: true,
        rating: true,
        createdAt: true,
        updatedAt: true,
        // Include arbitration cases for admins
        ...(isAdmin ? {
          arbitrations: {
            select: {
              id: true,
              caseNumber: true,
              status: true,
              updatedAt: true
            }
          }
        } : {})
      },
    });
    
    if (!arbitrator) {
      return NextResponse.json({ error: 'Arbitrator not found' }, { status: 404 });
    }
    
    // Add calculated fields for admins
    if (isAdmin && arbitrator.arbitrations) {
      const arbitratorWithStats = {
        ...arbitrator,
        assignedCases: arbitrator.arbitrations.length,
        completedCases: arbitrator.arbitrations.filter((c: any) => c.status === 'COMPLETED').length
      };
      return NextResponse.json(arbitratorWithStats);
    }
    
    return NextResponse.json(arbitrator);
  } catch (error) {
    console.error('Error fetching arbitrator:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arbitrator details' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing arbitrator
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
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Check if the updated email belongs to another user
    if (body.email !== existingArbitrator.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: body.email }
      });
      
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }
    
    // Prepare update data
    const updateData: any = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      expertise: body.expertise,
      qualifications: body.qualifications,
      experience: body.experience ? parseInt(body.experience) : null,
      bio: body.bio,
      languages: body.languages,
      location: body.location,
      hourlyRate: body.hourlyRate ? parseFloat(body.hourlyRate) : null,
      availabilityInfo: body.availabilityInfo,
      status: body.status
    };
    
    // Only update password if provided
    if (body.password) {
      updateData.password = body.password; // In a real app, hash this password
    }
    
    // Update the arbitrator
    const updatedArbitrator = await prisma.user.update({
      where: { id: arbitratorId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        expertise: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json(updatedArbitrator);
  } catch (error) {
    console.error('Error updating arbitrator:', error);
    return NextResponse.json(
      { error: 'Failed to update arbitrator' },
      { status: 500 }
    );
  }
}

// DELETE: Remove an arbitrator
export async function DELETE(
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
    
    // Check if arbitrator has any assigned cases
    const hasAssignedCases = await prisma.arbitration.findFirst({
      where: {
        arbitratorId: arbitratorId,
        status: {
          notIn: ['COMPLETED', 'CANCELLED']
        }
      }
    });
    
    if (hasAssignedCases) {
      return NextResponse.json(
        { error: 'Cannot delete arbitrator with active cases' },
        { status: 400 }
      );
    }
    
    // Delete the arbitrator
    await prisma.user.delete({
      where: { id: arbitratorId }
    });
    
    return NextResponse.json({ message: 'Arbitrator deleted successfully' });
  } catch (error) {
    console.error('Error deleting arbitrator:', error);
    return NextResponse.json(
      { error: 'Failed to delete arbitrator' },
      { status: 500 }
    );
  }
} 