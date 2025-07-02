import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch recent activities
export async function GET(request: NextRequest) {
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
    
    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Fetch recent user registrations
    const newUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    // Fetch recent arbitration cases
    const newCases = await prisma.arbitration.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        caseNumber: true,
        name: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Fetch case status changes
    const statusChanges = await prisma.arbitration.findMany({
      take: 5,
      where: {
        updatedAt: {
          gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        caseNumber: true,
        status: true,
        updatedAt: true
      }
    });
    
    // Combine and format the activities
    const userActivities = newUsers.map(user => ({
      id: `user-${user.id}`,
      type: 'USER_REGISTRATION',
      title: 'New User Registration',
      description: `${user.name} registered as ${user.role.toLowerCase()}`,
      timestamp: user.createdAt,
      meta: {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role
      }
    }));
    
    const caseActivities = newCases.map(caseItem => ({
      id: `case-${caseItem.id}`,
      type: 'CASE_CREATION',
      title: 'New Case Filed',
      description: `Case ${caseItem.caseNumber} filed by ${caseItem.user.name}`,
      timestamp: caseItem.createdAt,
      meta: {
        caseId: caseItem.id,
        caseNumber: caseItem.caseNumber,
        caseName: caseItem.name,
        caseStatus: caseItem.status,
        userId: caseItem.user.id,
        userName: caseItem.user.name
      }
    }));
    
    const statusActivities = statusChanges.map(statusChange => ({
      id: `status-${statusChange.id}-${statusChange.updatedAt.getTime()}`,
      type: 'CASE_STATUS_CHANGE',
      title: 'Case Status Updated',
      description: `Case ${statusChange.caseNumber} status changed to ${statusChange.status}`,
      timestamp: statusChange.updatedAt,
      meta: {
        caseId: statusChange.id,
        caseNumber: statusChange.caseNumber,
        newStatus: statusChange.status
      }
    }));
    
    // Combine all activities and sort by timestamp (most recent first)
    const allActivities = [
      ...userActivities, 
      ...caseActivities, 
      ...statusActivities
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
    
    return NextResponse.json({
      activities: allActivities,
      pagination: {
        total: allActivities.length,
        page,
        limit
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500 }
    );
  }
} 