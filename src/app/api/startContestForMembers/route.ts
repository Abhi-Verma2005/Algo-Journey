import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/authOptions';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contestId, memberIds, isAdmin } = body;

    if (!contestId || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Contest ID and member IDs array are required' },
        { status: 400 }
      );
    }

    const contest = await prisma.contest.findUnique({
      where: { id: Number(contestId) },
    });

    if (!contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
    }

    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; 
    const currentTimeIST = new Date(now.getTime() + istOffset);
    const contestStart = new Date(contest.startTime);
    const contestEnd = new Date(contest.endTime);

    if (currentTimeIST < contestStart) {
      return NextResponse.json({ 
        message: 'Cannot grant permissions before contest start time',
        startTime: contestStart
      }, { status: 250 });
    }

    if (currentTimeIST > contestEnd) {
      return NextResponse.json({ 
        message: 'Cannot grant permissions after contest end time',
        endTime: contestEnd
      }, { status: 240 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        coordinatedGroup: true,
      },
    });

   if(currentUser?.coordinatedGroup?.id){
    const permittedGroup = await prisma.groupPermission.findUnique({
      where: {
        groupId_contestId: {
          groupId: currentUser?.coordinatedGroup?.id,
          contestId
        }
      }
    });
    if (!permittedGroup) {
      return NextResponse.json({ message: 'This group is not permitted to enter this contest' }, { status: 440 });
    }
   }


    if ((!currentUser || !currentUser.coordinatedGroup) && !isAdmin) {
      return NextResponse.json(
        { error: 'Only group coordinators can start contests for members' },
        { status: 403 }
      );
    }

    if (!prisma.contestPermission) {
      return NextResponse.json(
        { 
          error: 'Prisma client needs to be regenerated. Run `npx prisma generate` to update your client with the latest schema changes.',
          details: 'The ContestPermission model is not available on the Prisma client.' 
        },
        { status: 500 }
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
      
      // Filter out users who already have permissions
      const newMemberIds = memberIds.filter(id => !existingUserIds.includes(id));

      if (newMemberIds.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'All selected members already have permission for this contest',
          data: existingPermission,
        });
      }

      // Update existing permission entry by adding new members
      contestPermission = await prisma.contestPermission.update({
        where: {
          id: existingPermission.id,
        },
        data: {
          users: {
            connect: newMemberIds.map(id => ({ id })),
          },
        },
        include: {
          users: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Added ${newMemberIds.length} new member(s) to contest permissions`,
        data: contestPermission,
      });
    } else {
      // Create new permission entry if none exists
      contestPermission = await prisma.contestPermission.create({
        data: {
          contestId: Number(contestId),
          users: {
            connect: memberIds.map(id => ({ id })),
          },
        },
        include: {
          users: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Contest permission granted to selected members',
        data: contestPermission,
      });
    }

  } catch (error) {
    console.error('Error starting contest for members:', error);
    return NextResponse.json(
      { error: 'Failed to start contest for members' },
      { status: 500 }
    );
  }
}