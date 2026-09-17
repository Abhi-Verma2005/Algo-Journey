import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [500, 1000, 2000];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isConnectionError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1000", "P1001", "P1002", "P1003", "P1008", "P1017", "P2024"].includes(err.code);
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("connection pool") ||
      msg.includes("timed out") ||
      msg.includes("timeout") ||
      msg.includes("connection closed") ||
      msg.includes("can't reach database server")
    );
  }
  return false;
}

export async function POST(req: Request) {
  let request: any;
  try {
    request = await req.json();
  } catch (parseError) {
    console.error("Invalid JSON body in signup request:", parseError);
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  if (!request || typeof request !== "object") {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const username = request.username ? String(request.username).trim() : "";
  const email = request.email ? String(request.email).trim().toLowerCase() : "";
  const password = request.password ? String(request.password) : "";
  const leetcodeUsername = request.leetcodeUsername ? String(request.leetcodeUsername).trim() : "";
  const codeforcesUsername = request.codeforcesUsername ? String(request.codeforcesUsername).trim() : "";
  const enrollmentNum = request.enrollmentNum ? String(request.enrollmentNum).trim() : "";
  const section = request.section ? String(request.section).trim().toUpperCase() : "";

  if (!username || !email || !password || !leetcodeUsername || !codeforcesUsername || !enrollmentNum || !section) {
    return NextResponse.json(
      { error: "All fields are required (username, email, password, LeetCode, Codeforces, enrollment number, section)" },
      { status: 400 }
    );
  }

  let hashedPassword: string;
  try {
    hashedPassword = await bcrypt.hash(password, 10);
  } catch (hashError) {
    console.error("Password hashing failed:", hashError);
    return NextResponse.json({ error: "Failed to process password" }, { status: 500 });
  }

  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      // 1. Check for duplicate conflicts across all unique constraints
      const conflictingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: email, mode: "insensitive" } },
            { username: { equals: username, mode: "insensitive" } },
            { enrollmentNum: { equals: enrollmentNum, mode: "insensitive" } },
            { leetcodeUsername: { equals: leetcodeUsername, mode: "insensitive" } },
            { codeforcesUsername: { equals: codeforcesUsername, mode: "insensitive" } },
          ],
        },
        select: {
          email: true,
          username: true,
          enrollmentNum: true,
          leetcodeUsername: true,
          codeforcesUsername: true,
        },
      });

      if (conflictingUser) {
        if (conflictingUser.email.toLowerCase() === email) {
          return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
        }
        if (conflictingUser.username.toLowerCase() === username.toLowerCase()) {
          return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
        }
        if (conflictingUser.enrollmentNum.toLowerCase() === enrollmentNum.toLowerCase()) {
          return NextResponse.json({ error: "Enrollment number is already registered" }, { status: 400 });
        }
        if (conflictingUser.leetcodeUsername.toLowerCase() === leetcodeUsername.toLowerCase()) {
          return NextResponse.json({ error: "LeetCode username is already registered" }, { status: 400 });
        }
        if (conflictingUser.codeforcesUsername.toLowerCase() === codeforcesUsername.toLowerCase()) {
          return NextResponse.json({ error: "Codeforces username is already registered" }, { status: 400 });
        }
      }

      // 2. Create User and initialize associated UserConfig & LeetCodeStats in a single transaction
      const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username,
            email,
            isComplete: true,
            password: hashedPassword,
            leetcodeUsername,
            codeforcesUsername,
            enrollmentNum,
            section,
          },
        });

        // Initialize UserConfig
        await tx.userConfig.upsert({
          where: { userEmail: email },
          update: {},
          create: {
            userEmail: email,
            leetcode_questions_solved: 0,
            codeforces_questions_solved: 0,
            rank: "novice_1",
          },
        });

        // Initialize LeetCodeStats
        await tx.leetCodeStats.upsert({
          where: { username },
          update: {
            email,
            leetcodeUsername,
          },
          create: {
            username,
            email,
            leetcodeUsername,
            totalSolved: 0,
            easySolved: 0,
            mediumSolved: 0,
            hardSolved: 0,
          },
        });

        return user;
      });

      return NextResponse.json(
        {
          message: "User registered successfully",
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            enrollmentNum: newUser.enrollmentNum,
          },
        },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = (error.meta?.target as string[]) || [];
        const field = target[0] || "field";
        console.warn(`P2002 Duplicate on field: ${field}`);
        return NextResponse.json(
          { error: `An account with this ${field} already exists` },
          { status: 400 }
        );
      }

      if (isConnectionError(error)) {
        retries++;
        if (retries < MAX_RETRIES) {
          const delay = RETRY_DELAYS[retries - 1] || 1000;
          console.warn(`Retrying user creation attempt ${retries + 1}/${MAX_RETRIES} after connection issue...`);
          await wait(delay);
          continue;
        }
      }

      console.error("Signup error:", error);
      return NextResponse.json(
        {
          error: "User creation failed. Please check your details and try again.",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: "Database connection failed after multiple attempts. Please try again in a moment." },
    { status: 500 }
  );
}