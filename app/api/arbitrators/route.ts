import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/arbitrators called');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Session from getServerSession:', session ? 'Session exists' : 'No session');
    
    if (!session?.user) {
      console.log('Unauthorized: No user in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    });
    
    console.log('User from database:', user ? `Found (ID: ${user.id}, Role: ${user.role})` : 'Not found');
    
    if (!user) {
      console.log('User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const expertise = searchParams.get('expertise');
    const status = searchParams.get('status') || 'active';
    
    console.log('Search params:', { search, expertise, status });
    
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
    
    console.log('Prisma where clause:', JSON.stringify(where, null, 2));
    
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
    
    console.log(`Found ${arbitrators.length} arbitrators matching criteria`);
    
    return NextResponse.json(arbitrators);
  } catch (error) {
    console.error('Error fetching arbitrators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arbitrators' },
      { status: 500 }
    );
  }
} 