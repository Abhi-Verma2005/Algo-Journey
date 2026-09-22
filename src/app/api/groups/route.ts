import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request
) {
    const request = await req.json()
  try {

    if (!request.body.userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: request.body.userEmail },
      include: {
        groups: {
          include: {
            coordinator: {
              select: {
                username: true,
                email: true,
              },
            },
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userGroups = user.groups || [];
    const userGroup = userGroups[0] || null;

    const groups = await prisma.group.findMany({
      include: {
        coordinator: {
          select: {
            username: true,
            email: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return NextResponse.json({ groups, userGroup, userGroups }, { status: 200 });
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}