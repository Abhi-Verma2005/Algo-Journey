import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findFirst({
      where: { email: { equals: userEmail, mode: "insensitive" } },
      select: {
        username: true,
        email: true,
        leetcodeUsername: true,
        codeforcesUsername: true,
        section: true,
        enrollmentNum: true,
        profileUrl: true,
        individualPoints: true,
      },
    });

    console.log(userEmail)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}