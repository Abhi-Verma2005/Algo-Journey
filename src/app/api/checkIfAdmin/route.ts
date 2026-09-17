import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/authOptions';

const admins = ['Abhishek Verma', 'Taj', 'Kunal', 'Sai', 'Yatharth-E'];

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: userEmail, mode: 'insensitive' },
      },
      select: { username: true },
    });

    if (!user || !user.username) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdmin = admins.includes(user.username);

    return NextResponse.json({ isAdmin }, { status: 200 });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}