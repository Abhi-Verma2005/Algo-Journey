import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { topics, teams, difficulties } = await req.json();
    const submissions = await prisma.submission.findMany({
      where: {
        status: 'ACCEPTED',
        question: {
          questionTags: {
            some: { name: { in: topics.split(",") } }, 
          },
          
          difficulty: difficulties ? { in: difficulties.split(",")} : undefined, 
        },
        user: {
          groups: {
            some: {
              name: { in: teams.split(",") },
            },
          },
        },
      },
      include: {
        user: { include: { groups: true } },
        question: {
            include: { questionTags: true }, 
        }, 
      },
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard data" }, { status: 500 });
  }
}