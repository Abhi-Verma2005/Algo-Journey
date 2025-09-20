import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession();
    const userEmail = session?.user?.email;
    if (!userEmail)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const {
      username,
      email,
      leetcodeUsername,
      codeforcesUsername,
      codechefUsername,
      section,
      enrollmentNum,
      profileUrl,
      individualPoints,
      oldPassword,
      newPassword,
    } = body.profile;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let passwordUpdate = {};

    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Incorrect old password" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      passwordUpdate = { password: hashedPassword };
    }

    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: {
        username,
        email,
        leetcodeUsername,
        codeforcesUsername,
        codechefUsername,
        section,
        enrollmentNum,
        profileUrl,
        individualPoints,
        ...passwordUpdate,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
