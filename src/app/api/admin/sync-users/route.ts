import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Optional admin security check or API key authorization
    // If authorization header matches API_KEY_ENCRYPTION_KEY or NEXTAUTH_SECRET, allow system call
    const authHeader = req.headers.get("authorization");
    const isSystemKey =
      authHeader &&
      (authHeader === `Bearer ${process.env.NEXTAUTH_SECRET}` ||
        authHeader === `Bearer ${process.env.API_KEY_ENCRYPTION_KEY}`);

    if (!isSystemKey) {
      if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check admin status
      const user = await prisma.user.findFirst({
        where: { email: { equals: session.user.email, mode: "insensitive" } },
        select: { username: true },
      });

      const admins = ["Abhishek Verma", "Taj", "Kunal", "Sai", "anshsx-D"];
      if (!user || !admins.includes(user.username)) {
        return NextResponse.json({ error: "Admin permission required" }, { status: 403 });
      }
    }

    // 1. Find all users missing UserConfig
    const usersWithoutConfig = await prisma.user.findMany({
      where: {
        config: null,
      },
      select: {
        email: true,
      },
    });

    let configsCreated = 0;
    if (usersWithoutConfig.length > 0) {
      const configData = usersWithoutConfig.map((u) => ({
        userEmail: u.email,
        leetcode_questions_solved: 0,
        codeforces_questions_solved: 0,
        rank: "novice_1" as const,
      }));

      const res = await prisma.userConfig.createMany({
        data: configData,
        skipDuplicates: true,
      });
      configsCreated = res.count;
    }

    // 2. Find all users missing LeetCodeStats
    const allUsers = await prisma.user.findMany({
      select: {
        username: true,
        email: true,
        leetcodeUsername: true,
        profileUrl: true,
      },
    });

    const existingStats = await prisma.leetCodeStats.findMany({
      select: { username: true },
    });
    const existingStatsUsernames = new Set(existingStats.map((s) => s.username));

    const usersToCreateStats = allUsers.filter((u) => !existingStatsUsernames.has(u.username));
    let statsCreated = 0;
    if (usersToCreateStats.length > 0) {
      const statsData = usersToCreateStats.map((user) => ({
        username: user.username,
        email: user.email,
        leetcodeUsername: user.leetcodeUsername,
        userProfileUrl: user.profileUrl || "",
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
      }));

      const res = await prisma.leetCodeStats.createMany({
        data: statsData,
        skipDuplicates: true,
      });
      statsCreated = res.count;
    }

    return NextResponse.json({
      success: true,
      message: "Sync completed successfully",
      stats: {
        totalUsers: allUsers.length,
        configsBackfilled: configsCreated,
        statsBackfilled: statsCreated,
      },
    });
  } catch (error) {
    console.error("Error running user sync:", error);
    return NextResponse.json(
      { error: "Sync failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
