import { NextRequest, NextResponse } from 'next/server';
import { Difficulty } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
) {
  try {
    const { url } = request

    const arr = url.split('/')
    const questionId = arr[arr.length - 1]
    
    const req = await request.json()
    const { slug, leetcodeUrl, codeforcesUrl, difficulty, points, tags, inArena } = req.updateData

    const currentQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        questionTags: true,
      },
    });

    if (!currentQuestion) {
      return NextResponse.json(
        { message: 'Question not found' },
        { status: 404 }
      );
    }

    const oldPoints = currentQuestion.points;
    const pointsDifference = points - oldPoints;
    const oldInArena = currentQuestion.inArena;

    const updatedQuestion = await prisma.$transaction(async (tx) => {
      // First, disconnect existing tags from the question without deleting the tags
      await tx.question.update({
        where: { id: questionId },
        data: {
          questionTags: {
            disconnect: currentQuestion.questionTags.map(tag => ({ id: tag.id }))
          }
        }
      });

      // Determine how to handle arenaAddedAt based on inArena change
      let arenaAddedAtUpdate = {};
      
      // If inArena is changing from false to true, set arenaAddedAt to current time
      if (inArena && !oldInArena) {
        arenaAddedAtUpdate = { arenaAddedAt: new Date() };
      } 
      // If inArena is changing from true to false, set arenaAddedAt to null
      else if (!inArena && oldInArena) {
        arenaAddedAtUpdate = { arenaAddedAt: null };
      }
      // If inArena is not changing, leave arenaAddedAt as is

      // Update the question with new details
      const updatedQuestion = await tx.question.update({
        where: { id: questionId },
        data: {
          slug,
          leetcodeUrl: leetcodeUrl || null,
          codeforcesUrl: codeforcesUrl || null,
          difficulty: difficulty as Difficulty,
          points,
          inArena: inArena || false,
          ...arenaAddedAtUpdate // Apply the arenaAddedAt update
        },
        include: {
          questionTags: true
        }
      });

      // Connect new tags to the question
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          const tag = await tx.questionTag.upsert({
            where: { name: tagName },
            create: { name: tagName },
            update: {},
          });
          await tx.question.update({
            where: { id: questionId },
            data: {
              questionTags: {
                connect: { id: tag.id }
              }
            }
          });
        }
      }

      // Handle point adjustments if necessary
      if (pointsDifference !== 0) {
        const submissions = await tx.submission.findMany({
          where: {
            questionId,
            status: 'ACCEPTED',
          },
          select: {
            userId: true,
            contestId: true,
          },
        });
        const userIds = [...new Set(submissions.map(s => s.userId))];
        
        for (const userId of userIds) {
          await tx.user.update({
            where: { id: userId },
            data: {
              individualPoints: {
                increment: pointsDifference
              }
            }
          });
        }

        const contestIds = [...new Set(submissions
          .filter(s => s.contestId !== null)
          .map(s => s.contestId))];
        for (const contestId of contestIds) {
          const groupContests = await tx.groupOnContest.findMany({
            where: { contestId: contestId as number },
            include: { group: true }
          });

          for (const groupContest of groupContests) {
            const groupUserSubmissions = await tx.submission.findMany({
              where: {
                questionId,
                status: 'ACCEPTED',
                contestId: contestId as number,
                user: {
                  groups: {
                    some: { id: groupContest.groupId }
                  }
                }
              }
            });
        
            const membersWhoSolved = groupUserSubmissions.length;
            const groupMembersCount = await tx.user.count({
              where: {
                groups: {
                  some: { id: groupContest.groupId }
                }
              }
            });
            const divisor = Math.max(4, groupMembersCount);
            const groupPointsToAdd = (membersWhoSolved * pointsDifference) / divisor;
            
            await tx.group.update({
              where: { id: groupContest.groupId },
              data: {
                groupPoints: {
                  increment: groupPointsToAdd
                }
              }
            });
            await tx.groupOnContest.update({
              where: { id: groupContest.id },
              data: {
                score: {
                  increment: groupPointsToAdd
                }
              }
            });
          }
          
          const updatedGroupContests = await tx.groupOnContest.findMany({
            where: { contestId: contestId as number },
            orderBy: { score: 'desc' }
          });
          
          for (let i = 0; i < updatedGroupContests.length; i++) {
            await tx.groupOnContest.update({
              where: { id: updatedGroupContests[i].id },
              data: { rank: i + 1 }
            });
          }
        }
      }

      return updatedQuestion;
    }, { timeout: 15000 });

    return NextResponse.json({ 
      message: 'Question updated successfully',
      question: updatedQuestion
    });

  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { message: 'Internal server error', error },
      { status: 500 }
    );
  }
}