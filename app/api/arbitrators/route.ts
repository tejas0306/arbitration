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
    
    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const expertise = searchParams.get('expertise');
    const status = searchParams.get('status') || 'active';
    
    
    // Build where clause for filtering
    const where: any = {
      role: 'ARBITRATOR',
    };
    
    // Only include active arbitrators unless specified otherwise
    if (status) {
      where.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { expertise: { contains: search, mode: 'insensitive' } },
        { qualifications: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Add expertise filter if provided
    if (expertise && expertise !== 'all') {
      where.expertise = { contains: expertise, mode: 'insensitive' };
    }
    
    
    // Query arbitrators
    const arbitrators = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
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
      },
      orderBy: [
        { rating: 'desc' },
        { experience: 'desc' },
        { name: 'asc' },
      ],
    });
    
    
    return NextResponse.json(arbitrators);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch arbitrators' },
      { status: 500 }
    );
  }
} 