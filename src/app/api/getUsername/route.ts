import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userEmail = session.user.email;

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: userEmail, mode: "insensitive" },
      },
      select: {
        username: true,
        enrollmentNum: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { username: user.username, enrollmentNum: user.enrollmentNum },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in getUsername:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}