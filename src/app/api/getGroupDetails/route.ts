import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const request = await req.json();
    const { id: groupId } = request

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          select: {
            id: true,
            username: true,
            email: true,
            section: true,
            groups: {
              select: { name: true } 
            },
            leetcodeUsername: true,
            codeforcesUsername: true,
            individualPoints: true,
            createdAt: true,
            updatedAt: true
          }
        },

        coordinator: {
          select: {
            id: true,
            username: true,
            email: true,
            section: true
          }
        }
      },
    });

    


    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ group }, { status: 200 });
  } catch (error) {
    console.error("Error fetching group details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}