import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contestId } = body;

    if (!contestId) {
      return NextResponse.json(
        { error: 'Invalid request. Contest ID is required' },
        { status: 400 }
      );
    }

    const contest = await prisma.contest.findUnique({
      where: { id: Number(contestId) },
    });

    if (!contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
    }

    // Time validation checks
    // const now = new Date();
    // const istOffset = 5.5 * 60 * 60 * 1000; 
    // const currentTimeIST = new Date(now.getTime() + istOffset);
    // const contestStart = new Date(contest.startTime);
    // const contestEnd = new Date(contest.endTime);

    // if (currentTimeIST < contestStart) {
    //   return NextResponse.json({ 
    //     message: 'Cannot grant permissions before contest start time',
    //     startTime: contestStart
    //   }, { status: 250 });
    // }

    // if (currentTimeIST > contestEnd) {
    //   return NextResponse.json({ 
    //     message: 'Cannot grant permissions after contest end time',
    //     endTime: contestEnd
    //   }, { status: 240 });
    // }

    // Get all coordinators
    const coordinators = await prisma.user.findMany({
      where: {
        coordinatedGroup: {
          isNot: null
        }
      }
    });

    if (!coordinators || coordinators.length === 0) {
      return NextResponse.json(
        { error: 'No coordinators found in the system' },
        { status: 404 }
      );
    }

    // Find existing permission entry for this contest
    const existingPermission = await prisma.contestPermission.findFirst({
      where: {
        contestId: Number(contestId),
      },
      include: {
        users: true,
      }
    });

    let contestPermission;

    if (existingPermission) {
      // Get IDs of users who already have permissions
      const existingUserIds = existingPermission.users.map(user => user.id);
      
      // Filter out coordinators who already have permissions
      const newCoordinatorIds = coordinators
        .map(coord => coord.id)
        .filter(id => !existingUserIds.includes(id));

      if (newCoordinatorIds.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'All coordinators already have permission for this contest',
          data: existingPermission,
        });
      }

      // Update existing permission entry by adding new coordinators
      contestPermission = await prisma.contestPermission.update({
        where: {
          id: existingPermission.id,
        },
        data: {
          users: {
            connect: newCoordinatorIds.map(id => ({ id })),
          },
        },
        include: {
          users: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Added ${newCoordinatorIds.length} new coordinator(s) to contest permissions`,
        data: contestPermission,
      });
    } else {
      // Create new permission entry if none exists
      contestPermission = await prisma.contestPermission.create({
        data: {
          contestId: Number(contestId),
          users: {
            connect: coordinators.map(coord => ({ id: coord.id })),
          },
        },
        include: {
          users: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Contest permission granted to all coordinators',
        data: contestPermission,
      });
    }

  } catch (error) {
    console.error('Error setting permissions for coordinators:', error);
    return NextResponse.json(
      { error: 'Failed to set permissions for coordinators' },
      { status: 500 }
    );
  }
}