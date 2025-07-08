import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
    

        const session = await getServerSession()
        const userEmail = session?.user?.email

        if (!userEmail) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: userEmail },
            select: { codeforcesUsername: true, leetcodeUsername: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ codeforcesUsername: user.codeforcesUsername, leetcodeUsername: user.leetcodeUsername });
    } catch (error) {
        console.error("Error handling request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}