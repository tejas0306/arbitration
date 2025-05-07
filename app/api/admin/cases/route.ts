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

    // For demonstration purposes, fetch all arbitration cases directly from DB
    // In a production app, you should implement proper authentication/authorization
    
    const cases = await prisma.arbitration.findMany({
      select: {
        id: true,
        caseNumber: true,
        type: true,
        name: true,
        email: true,
        status: true,
        isDraft: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(cases);
  } catch (error) {
    console.error('Error fetching arbitration cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arbitration cases' },
      { status: 500 }
    );
  }
} 