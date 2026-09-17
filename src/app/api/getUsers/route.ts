
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Fetch users who are NOT coordinators
    const users = await prisma.user.findMany({
      where: {
        coordinatedGroup: null, // Users who are NOT coordinators
        groupId: null
      },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}