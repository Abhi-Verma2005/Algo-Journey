import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const admins = ['Abhishek Verma', 'Taj', 'Kunal', 'Sai'];

export async function POST() {
  try {
    const session = await getServerSession();

    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
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
  } finally {
    await prisma.$disconnect();
  }
}