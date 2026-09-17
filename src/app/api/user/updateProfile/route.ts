import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/authOptions";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const {
      username,
      email,
      leetcodeUsername,
      codeforcesUsername,
      section,
      enrollmentNum,
      profileUrl,
      individualPoints,
      oldPassword,
      newPassword,
    } = body.profile;

    const user = await prisma.user.findFirst({
      where: { email: { equals: userEmail, mode: "insensitive" } },
      select: { id: true, password: true, email: true, username: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let passwordUpdate = {};

    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: "Incorrect old password" }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      passwordUpdate = { password: hashedPassword };
    }

    const newUsername = username ? username.trim() : user.username;
    const newEmail = email ? email.trim().toLowerCase() : user.email;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          username: newUsername,
          email: newEmail,
          leetcodeUsername: leetcodeUsername ? leetcodeUsername.trim() : undefined,
          codeforcesUsername: codeforcesUsername ? codeforcesUsername.trim() : undefined,
          section,
          enrollmentNum: enrollmentNum ? enrollmentNum.trim() : undefined,
          profileUrl,
          individualPoints,
          ...passwordUpdate,
        },
      });

      // Keep UserConfig and LeetCodeStats in sync if email/username changes
      if (newEmail !== user.email) {
        await tx.userConfig.updateMany({
          where: { userEmail: user.email },
          data: { userEmail: newEmail },
        });
      }

      if (newUsername !== user.username) {
        await tx.leetCodeStats.updateMany({
          where: { username: user.username },
          data: { username: newUsername, email: newEmail },
        });
      }

      return updated;
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}