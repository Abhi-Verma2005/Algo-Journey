import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}


export async function POST(req: Request) {
  try {
    const { externalUserId, questionSlug, contest } = await req.json();

    if (!externalUserId || !questionSlug) {
      return NextResponse.json({ error: "Missing required fields" }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: externalUserId },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    const question = await prisma.question.findUnique({
      where: { slug: questionSlug },
    });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    let awardedScore = question.points
    if (!contest) {
      awardedScore = Math.floor(awardedScore / 2);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { individualPoints: { increment: awardedScore } },
    });

    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        questionId: question.id,
        contestId: contest ? undefined : null,
        score: awardedScore,
        status: 'ACCEPTED',
      },
    });

    if (!submission) {
      return NextResponse.json({ message: "Submission not created" }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    return NextResponse.json({ message: "Score updated and submission recorded successfully", awardedScore }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error) {
    console.error("Error in submission route:", error);
    return NextResponse.json({ error: "Internal server error" }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
} 
