import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch cases for the current user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const status = url.searchParams.get('status') || undefined;
    
    // Build filter based on user role
    const filter: any = {};
    
    // For claimant or respondent, only show their own cases
    if (user.role === 'CLAIMANT') {
      filter.userId = user.id;
    }
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }
    
    // Fetch the user's cases
    const cases = await prisma.arbitration.findMany({
      where: filter,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Count total cases for pagination
    const totalCases = await prisma.arbitration.count({
      where: filter
    });
    
    return NextResponse.json({
      cases,
      pagination: {
        total: totalCases,
        page,
        limit,
        pages: Math.ceil(totalCases / limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
} 