import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

interface Data {
  name?: string;
  members?: { set: { id: string }[] };
  coordinator?: { connect: { id: string } };
}

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

    const admins = ["Abhishek Verma", "Taj", "Kunal", "Sai"];
    if (!user.username || !admins.includes(user.username)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, users, coordinator, newGroupName } = request;

    if (!name) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "At least one user is required" }, { status: 400 });
    }

    const existingGroup = await prisma.group.findUnique({
      where: { name },
      include: { members: true },
    });

    if (existingGroup) {
      const updatedGroup = await prisma.$transaction(async (tx) => {
        const updateData: Data = {};

        if (newGroupName) {
          updateData.name = newGroupName;
        }

        if (coordinator) {
          const coordinatorExists = await tx.user.findUnique({
            where: { id: coordinator }
          });
          if (coordinatorExists) {
            updateData.coordinator = { connect: { id: coordinator } };
          }
        }

        updateData.members = {
          set: users.map((id: string) => ({ id }))
        };

        return await tx.group.update({
          where: { id: existingGroup.id },
          data: updateData,
          include: { 
            members: true,
            coordinator: true,
          },
        });
      }, { timeout: 30000 });

      let updateMessage = "Group updated successfully:";
      updateMessage += ` ${users.length} members set.`;
      if (coordinator) updateMessage += " Coordinator updated.";
      if (newGroupName) updateMessage += " Name updated.";

      return NextResponse.json({ 
        group: updatedGroup, 
        message: updateMessage,
        updates: {
          membersProcessed: users.length,
          nameUpdated: !!newGroupName,
          coordinatorUpdated: !!coordinator
        }
      }, { status: 200 });
    } else {
      // Require coordinator for new group creation
      if (!coordinator) {
        return NextResponse.json({ error: "Coordinator is required for new group creation" }, { status: 400 });
      }

      // Verify coordinator exists
      const coordinatorExists = await prisma.user.findUnique({
        where: { id: coordinator }
      });

      if (!coordinatorExists) {
        return NextResponse.json({ error: "Coordinator not found" }, { status: 404 });
      }

      const group = await prisma.$transaction(async (tx) => {
        const newGroup = await tx.group.create({
          data: {
            name,
            coordinator: { connect: { id: coordinator } },
            members: { connect: users.map((id: string) => ({ id })) }
          },
          include: {
            members: true,
            coordinator: true,
          },
        });

        return newGroup;
      }, { timeout: 30000 });

      return NextResponse.json({ 
        group, 
        message: "Group created successfully",
        updates: {
          membersAdded: users.length,
          nameUpdated: true,
          coordinatorUpdated: true
        }
      }, { status: 200 });
    }
  } catch (error) {
    console.error("Error creating/updating group:", error);
    return NextResponse.json({ error: "Failed to create/update group" }, { status: 500 });
  }
}