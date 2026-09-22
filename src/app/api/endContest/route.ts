import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession()
        const userEmail = session?.user?.email
        const body = await req.json();
        const { contestId, finalScore, questions, questionsFromDb } = body;

        
        if (!contestId || !userEmail || typeof finalScore !== "number" || !Array.isArray(questions)) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        const contestID = parseInt(contestId);

        const latestContest = await prisma.contest.findFirst({
            orderBy:{
                id: 'desc'
            }
        })
        

        const user = await prisma.user.findUnique({
            where: { email: userEmail },
            include: { groups: { include: { members: true } } },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const result = await prisma.$transaction(async (prisma) => {
            // Delete the TempContestTime entry for this user and contest
            await prisma.tempContestTime.deleteMany({
                where: {
                    userId: user.id,
                    contestId: contestID
                }
            });
            
            // Handle empty questions array by creating a dummy submission
            if (questions.length === 0 && Array.isArray(questionsFromDb) && questionsFromDb.length > 0) {
                // Select a random question from questionsFromDb
                const randomIndex = Math.floor(Math.random() * questionsFromDb.length);
                const randomQuestion = questionsFromDb[randomIndex];
                
                // Create a dummy submission with zero score
                if (randomQuestion && randomQuestion.question && randomQuestion.question.id) {
                    await prisma.submission.create({
                        data: {
                            userId: user.id,
                            questionId: randomQuestion.question.id,
                            contestId: contestID,
                            status: 'PENDING', // or use a different status like "PENDING" if preferred
                            score: 0, // Zero score for dummy submission
                        },
                    });
                }
            } else {
                // Process normal submissions if questions array is not empty
                await Promise.all(
                    questions.map(async (questionId) => {
                        const question = await prisma.questionOnContest.findFirst({
                            where: { questionId: questionId },
                            include: { question: true },
                        });

                        console.log('question: ', question)

                        if (!question || !question.question) {
                            throw new Error(`Invalid questionId: ${questionId}`);
                        }

                        await prisma.submission.create({
                            data: {
                                userId: user.id,
                                questionId: question.question.id,
                                contestId: contestID,
                                status: "ACCEPTED",
                                score: question.question.points,
                            },
                        });
                    })
                );
            }

            // Update individual points
            const userSubmissions = await prisma.submission.findMany({
                where: { userId: user.id, status: "ACCEPTED" },
                select: { score: true },
            });

            const totalUserPoints = userSubmissions.reduce((acc, curr) => acc + (curr.score || 0), 0);

            await prisma.user.update({
                where: { id: user.id },
                data: { individualPoints: totalUserPoints },
            });

            const contestGroup = await prisma.group.findFirst({
                where: {
                    groupPermissions: { some: { contestId: contestID } },
                    members: { some: { id: user.id } },
                },
                include: { members: true },
            });

            if (contestGroup) {
                const contestPermission = await prisma.contestPermission.findFirst({
                    where: { contestId: contestID },
                    include: { users: true },
                });

                const totalPermittedMembers = contestPermission
                    ? contestPermission.users.filter((u) => contestGroup.members.some((m) => m.id === u.id)).length
                    : 1;

                const divisor = Math.max(4, Math.max(1, totalPermittedMembers));
                const averageScore = finalScore / divisor;

                if (latestContest) {
                    const now = new Date();
                    const istOffset = 5.5 * 60 * 60 * 1000;
                    const currentTimeIST = new Date(now.getTime() + istOffset);
                    const contestStart = new Date(latestContest.startTime);
                    const contestEnd = new Date(latestContest.endTime);

                    if (contestStart <= currentTimeIST && currentTimeIST <= contestEnd) {
                        await prisma.groupOnContest.upsert({
                            where: { groupId_contestId: { groupId: contestGroup.id, contestId: contestID } },
                            create: { groupId: contestGroup.id, contestId: contestID, score: averageScore },
                            update: { score: { increment: averageScore } },
                        });
                    }
                }

                const groupsInContest = await prisma.groupOnContest.findMany({
                    where: { contestId: contestID },
                    orderBy: { score: "desc" },
                });

                for (let i = 0; i < groupsInContest.length; i++) {
                    await prisma.groupOnContest.update({
                        where: { id: groupsInContest[i].id },
                        data: { rank: i + 1 },
                    });
                }

                const totalGroupPoints = await prisma.groupOnContest.findMany({
                    where: { groupId: contestGroup.id },
                    select: { score: true },
                });

                const groupTotalScore = totalGroupPoints.reduce((acc, curr) => acc + (curr.score || 0), 0);
                await prisma.group.update({
                    where: { id: contestGroup.id },
                    data: { groupPoints: groupTotalScore },
                });

                if (contestPermission) {
                    const permittedMemberIds = contestPermission.users
                        .filter((u) => contestGroup.members.some((m) => m.id === u.id))
                        .map((u) => u.id);

                    if (permittedMemberIds.length > 0) {
                        const allMembersSubmissions = await prisma.submission.findMany({
                            where: { 
                                contestId: contestID, 
                                userId: { in: permittedMemberIds } 
                            },
                            distinct: ["userId"],
                        });

                        if (allMembersSubmissions.length === permittedMemberIds.length) {
                            await prisma.contest.update({
                                where: { id: contestID },
                                data: { status: "COMPLETED" },
                            });
                        }
                    }
                }
            }

            return { message: "Contest submissions recorded successfully" };
        },{
            timeout: 40000, 
            isolationLevel: "ReadCommitted", // Ensures consistency but improves concurrency
        });

        return NextResponse.json({ message: result.message }, { status: 200 });

    } catch (error) {
        console.error("Error processing contest submissions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}