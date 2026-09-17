import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/authOptions';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    const user = await prisma.user.findFirst({
      where: { email: { equals: userEmail, mode: 'insensitive' } },
      select: { coordinatedGroup: { select: { id: true } } },
    });

    if (user?.coordinatedGroup) {
      return NextResponse.json({ isCoordinator: true, groupId: user.coordinatedGroup.id });
    }

    return NextResponse.json({ isCoordinator: false });

  } catch (error) {
    console.error('Error checking coordinator status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}