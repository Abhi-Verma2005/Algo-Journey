import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: Request,
) {
    const request = await req.json()
  const { questionId } = request;

  try {
    // Verify that questionId exists
    const questionExists = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!questionExists) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Handle deletion and point updates in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Get all successful submissions for this question
      const submissions = await tx.submission.findMany({
        where: {
          questionId: questionId,
          status: 'ACCEPTED'
        },
        select: {
          userId: true,
          score: true
        }
      });

      // 2. Update points for all affected users
      for (const sub of submissions) {
        await tx.user.update({
          where: { id: sub.userId },
          data: {
            individualPoints: {
              decrement: sub.score
            }
          }
        });
      }

      // 3. Delete the question (will cascade to all related records)
      await tx.question.delete({
        where: { id: questionId }
      });
    });

    return NextResponse.json(
      { message: 'Question deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}