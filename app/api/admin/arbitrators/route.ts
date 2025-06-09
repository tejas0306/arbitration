import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch all arbitrators with filtering options
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
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    
    // Build filters for the query
    const filters: any = {
      role: 'ARBITRATOR'
    };
    
    if (status && status !== 'all') {
      filters.status = status;
    }
    
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { expertise: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Query the database
    const arbitrators = await prisma.user.findMany({
      where: filters,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        expertise: true,
        qualifications: true,
        experience: true,
        bio: true,
        languages: true,
        location: true,
        hourlyRate: true,
        availabilityInfo: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // Calculate number of assigned and completed cases
        _count: {
          select: {
            arbitrations: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transform data to include calculated fields
    const transformedData = arbitrators.map(arbitrator => ({
      ...arbitrator,
      assignedCases: arbitrator._count.arbitrations,
      completedCases: 0, // Would need a more complex query to get completed cases
      _count: undefined // Remove the _count property
    }));
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching arbitrators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arbitrators' },
      { status: 500 }
    );
  }
}

// POST: Create a new arbitrator
export async function POST(request: NextRequest) {
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
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }
    
    // Create the new arbitrator
    const newArbitrator = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: body.password, // In a real app, hash this password
        role: 'ARBITRATOR',
        phone: body.phone,
        expertise: body.expertise,
        qualifications: body.qualifications,
        experience: body.experience ? parseInt(body.experience) : null,
        bio: body.bio,
        languages: body.languages,
        location: body.location,
        hourlyRate: body.hourlyRate ? parseFloat(body.hourlyRate) : null,
        availabilityInfo: body.availabilityInfo,
        status: body.status || 'pending'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    });
    
    return NextResponse.json(newArbitrator, { status: 201 });
  } catch (error) {
    console.error('Error creating arbitrator:', error);
    return NextResponse.json(
      { error: 'Failed to create arbitrator' },
      { status: 500 }
    );
  }
} 