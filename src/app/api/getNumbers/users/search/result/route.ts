import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { name } = data;

        if (!name) {
            return NextResponse.json({ error: "Name query is required" }, { status: 400 });
        }

        // Find user by email (partial match & case-insensitive)
        const user = await prisma.user.findFirst({
            where: {
                email: {
                    contains: name,
                    mode: "insensitive",
                },
            },
            include: {
                groups: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const formattedUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            section: user.section,
            group: {
                name: user.groups.map((g) => g.name).join(", ") || "No Group",
            },
            leetcodeUsername: user.leetcodeUsername,
            codeforcesUsername: user.codeforcesUsername,
            individualPoints: user.individualPoints,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        return NextResponse.json({ formattedUsers: [formattedUser] }, { status: 200 });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}