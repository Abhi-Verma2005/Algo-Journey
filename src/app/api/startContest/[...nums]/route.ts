import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

interface Contest {
    id: number,
    startTime: string,
    endTime: string,
    questions: object[]
}

export async function POST(
    request: Request
) {
    try {
        const session = await getServerSession();
        const userEmail = session?.user?.email;
        const url = request.url;

        if (!userEmail) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        // Extract contest ID from URL
        const contestNumber = url.split('/api/startContest/')[1];
        
        if (!contestNumber) {
            return Response.json({ error: 'Contest number not found' }, { status: 400 });
        }

        // Convert to number and validate
        const contestId = parseInt(contestNumber);

        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });
        
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 400 });
        }

        // Get the requested contest
        const contestData = await prisma.contest.findUnique({
            where: { id: contestId },
            include: {
                questions: {
                    include: { question: true },
                },
            },
        });

        
        if (!contestData) {
            return NextResponse.json({ error: "Contest not found" }, { status: 404 });
        }

        // Find the latest active contest for comparison
        const latestContest = await prisma.contest.findFirst({
            where: { status: 'ACTIVE' },
            orderBy: { startTime: 'desc' },
        });

        const contest: Contest = {
            ...contestData,
            startTime: contestData.startTime.toISOString(),
            endTime: contestData.endTime.toISOString(),
        };

        const groupsArray = await prisma.groupPermission.findMany({
            where: {
                contestId: Number(contestNumber),
            },
        });

        const permittedGroupIds = groupsArray.map((p) => p.groupId);

        let userGroup = await prisma.group.findFirst({
            where: {
                id: { in: permittedGroupIds },
                members: {
                    some: { id: user.id },
                },
            },
        });

        if (!userGroup) {
            const anyUserGroup = await prisma.group.findFirst({
                where: {
                    members: {
                        some: { id: user.id },
                    },
                },
            });

            if (!anyUserGroup) {
                return NextResponse.json({ message: "User not part of any group" }, { status: 404 });
            }

            return NextResponse.json({ message: "Your group not allwed for this contest" }, { status: 403 });
        }

        // Check if this is the latest contest
        const isLatestContest = latestContest?.id === contestId;

        // Time calculations
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // IST offset from UTC
        const currentTimeIST = new Date(now.getTime() + istOffset);
        
        const contestStart = new Date(contest.startTime);
        const contestEnd = new Date(contest.endTime);
        const joiningWindowEnd = new Date(contestStart.getTime() + (10 * 60 * 1000)); // 10 minutes after start

        if (isLatestContest) {
            // FLOW 1: Latest contest - Check permissions and enforce timing
            
            // Check for contest permission
            const hasPermission = await prisma.contestPermission.findFirst({
                where: {
                    contestId: contestId,
                    users: {
                        some: { id: user.id }
                    }
                }
            });

            if (!hasPermission) {
                return NextResponse.json({ 
                    message: "You don't have permission to attempt this contest",
                    
                }, { status: 490 });
            }

            const existingSubmission = await prisma.submission.findFirst({
                where: {
                    userId: user.id,
                    contestId: contest.id,
                    status: { in: ['PENDING', "ACCEPTED"] }
                }   
            });
            
            if (existingSubmission) {
                return NextResponse.json({
                    message: "User has already participated in this contest"
                }, { status: 430 });
            }

        
            if (currentTimeIST < contestStart) {
                return NextResponse.json({ 
                    message: "Contest hasn't started yet",
                    startTime: contestStart
                }, { status: 440 });
            }

            if (currentTimeIST > contestEnd) {
                return NextResponse.json({ 
                    message: "Contest has ended",
                    endTime: contestEnd
                }, { status: 420 });
            }
        } else {
      
            console.log("Practice mode - attempting older contest");
        }

        // Common code for both flows: Set up GroupOnContest relation and calculate times
        let groupOnContest = await prisma.groupOnContest.findUnique({
            where: {
                groupId_contestId: {
                    groupId: userGroup.id,
                    contestId: contest.id,
                },
            },
        });

        if (!groupOnContest) {
            groupOnContest = await prisma.groupOnContest.create({
                data: {
                    groupId: userGroup.id,
                    contestId: contest.id,
                    score: 0,
                },
            });
        }
        
        // Handle time calculation and TempContestTime entry
        let remainingTime = 0;
        let contestEndTime;
        
        const existingTimeEntry = await prisma.tempContestTime.findFirst({
            where: {
                contestId,
                userId: user.id
            }
        });

        if (existingTimeEntry) {
            // If entry exists, calculate remaining time
            const endTimeDate = new Date(existingTimeEntry.endTime);
            remainingTime = Math.max(0, endTimeDate.getTime() - now.getTime());
            contestEndTime = endTimeDate;
        } else {
            // If no entry exists, create one with now + duration
            const contestDurationMs = contestData.duration * 60 * 1000; // Convert to milliseconds
            contestEndTime = new Date(now.getTime() + contestDurationMs);
            
            await prisma.tempContestTime.create({
                data: {
                    contestId,
                    userId: user.id,
                    endTime: contestEndTime
                }
            });
            
            remainingTime = contestDurationMs;
        }

        // Get user's accepted submissions to mark questions as solved
        const acceptedSubmissions = await prisma.submission.findMany({
            where: {
                userId: user.id,
                status: 'ACCEPTED',
            },
            select: {
                questionId: true,
            },
        });

        const solvedQuestionIds = new Set(acceptedSubmissions.map(sub => sub.questionId));

        // Add isSolved property to each question in the contest
        const questionsWithSolvedStatus = contest.questions.map((questionObj) => ({
            ...questionObj,
            question: {//@ts-expect-error: don't want it here
                ...questionObj.question,//@ts-expect-error: don't want it here
                isSolved: solvedQuestionIds.has(questionObj.question.id),
            },
        }));

        return NextResponse.json({
            message: isLatestContest ? "Starting active contest" : "Starting practice contest",
            contest: {
                id: contest.id,
                duration: contestData.duration,
                startTime: contestStart,
                endTime: contestEnd,
                joiningWindowEnd,
                remainingTime: Math.floor(remainingTime/60000),
                contestEndTime,
                isPractice: !isLatestContest
            },
            questions: questionsWithSolvedStatus,
            groupId: userGroup.id,
            individualPoints: user.individualPoints,
            status: 200
        });

    } catch (error) {
        console.error('Contest route error:', error);
        return NextResponse.json({ 
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}