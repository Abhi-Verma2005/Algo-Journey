import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Route to get slugs related to a given query question
export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    const questions = await prisma.question.findMany({
      where: {
        OR: [
          { leetcodeUrl: { contains: query, mode: "insensitive" } },
          { codeforcesUrl: { contains: query, mode: "insensitive" } },
          { codechefUrl: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
          { questionTags: { some: { name: { contains: query, mode: "insensitive" } } } }
        ],
      },
      select: {
        slug: true,
      },
    });

    // Convert array of objects into an array of strings
    const slugs = questions.map((q) => q.slug);

    return NextResponse.json({ slugs });
  } catch (error) {
    console.error("Error fetching slugs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}