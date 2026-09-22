import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { groupId, userEmail } = await req.json();

    if (!groupId || !userEmail) {
      return NextResponse.json({ error: 'Group ID and user email are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          select: { id: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isAlreadyMember = group.members.some((member) => member.id === user.id);
    if (isAlreadyMember) {
      return NextResponse.json({ error: 'You are already a member of this group' }, { status: 400 });
    }

    await prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          connect: { id: user.id },
        },
      },
    });

    return NextResponse.json({ message: 'Successfully joined group' }, { status: 200 });
  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
  }
}
