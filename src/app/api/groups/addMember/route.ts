import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const request = await req.json();
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Admin check - using the same admin list as the groups route
    const admins = ["Abhishek Verma", "Taj", "Kunal", "Sai"];
    if (!user.username || !admins.includes(user.username)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { groupId, userIds } = request;

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "At least one user ID is required" }, { status: 400 });
    }

    // Check if group exists
    const existingGroup = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!existingGroup) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get current member IDs
    const currentMemberIds = existingGroup.members.map(member => member.id);

    // Filter out users who are already members
    const newUserIds = userIds.filter(id => !currentMemberIds.includes(id));

    if (newUserIds.length === 0) {
      return NextResponse.json({ 
        message: "All selected users are already members of this group",
        updates: { membersAdded: 0 }
      }, { status: 200 });
    }

    // Verify all new users exist
    const validUsers = await prisma.user.findMany({
      where: { id: { in: newUserIds } },
    });

    if (validUsers.length !== newUserIds.length) {
      return NextResponse.json({ error: "One or more selected users not found" }, { status: 404 });
    }

    const updatedGroup = await prisma.$transaction(async (tx) => {
      const group = await tx.group.update({
        where: { id: groupId },
        data: {
          members: {
            connect: newUserIds.map((id) => ({ id })),
          },
        },
        include: {
          members: true,
          coordinator: true,
        },
      });

      return group;
    }, { timeout: 30000 });

    return NextResponse.json({
      group: updatedGroup,
      message: `Successfully added ${newUserIds.length} new members to the group`,
      updates: {
        membersAdded: newUserIds.length,
        totalMembers: updatedGroup.members.length,
      },
    }, { status: 200 });

  } catch (error) {
    console.error("Error adding members to group:", error);
    return NextResponse.json({ error: "Failed to add members to group" }, { status: 500 });
  }
}