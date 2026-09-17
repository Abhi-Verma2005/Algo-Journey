import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/authOptions';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { problemName } = await req.json();
    
    if (!problemName) {
      return NextResponse.json({ error: 'Problem name is required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: session.user.email, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if there's any accepted submission for this user and problem
    const solvedSubmission = await prisma.submission.findFirst({
      where: {
        userId: user.id,
        question: {
          slug: problemName,
        },
        status: 'ACCEPTED',
      },
    });

    return NextResponse.json({ solved: !!solvedSubmission });
  } catch (error) {
    console.error('Error checking problem solution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}