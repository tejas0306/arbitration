import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // In a real app, you would check the session and ensure admin role
    // const session = await getServerSession();
    // if (!session || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // For demonstration purposes, fetch all users directly from DB
    // In a production app, you should implement proper authentication/authorization
    
    // Connect to the database using the connection info from .env
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organization: true,
        createdAt: true,
        updatedAt: true,
        // Exclude sensitive fields like password
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 