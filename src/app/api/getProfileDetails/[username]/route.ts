import { NextResponse } from "next/server";
import { z } from "zod";
import { ContestStatus, Difficulty, SubmissionStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

// Type definitions for the response data
type UserProfileResponse = {
  success: boolean;
  data?: {
    user: {
      id: string;
      username: string;
      email: string;
      leetcodeUsername: string;
      codeforcesUsername: string;
      section: string;
      enrollmentNum: string;
      individualPoints: number;
      profileUrl?: string | null;
      createdAt: Date;
      group?: {
        id: string;
        name: string;
        groupPoints: number;
        coordinator: {
          username: string;
          email: string;
        };
      } | null;
      groups?: Array<{
        id: string;
        name: string;
        groupPoints: number;
        coordinator: {
          username: string;
          email: string;
        };
      }>;
      submissions: Array<{
        id: string;
        score: number;
        status: SubmissionStatus;
        createdAt: Date;
        question: {
          id: string;
          leetcodeUrl?: string | null;
          codeforcesUrl?: string | null;
          difficulty: Difficulty;
          points: number;
          slug: string;
          questionTags: Array<{
            name: string;
          }>;
        };
        contest?: {
          id: number;
          name: string;
          startTime: Date;
          endTime: Date;
          status: ContestStatus;
        } | null;
      }>;
      
      
    },
    contests: Array<{
      id: number;
      name: string;
      startTime: Date;
      endTime: Date;
      status: ContestStatus;
      submissions: Array<{
        id: string;
        score: number;
        status: SubmissionStatus;
        question: {
          slug: string;
          difficulty: Difficulty;
          points: number;
        };
      }>;
      groupPerformance?: {
        score: number;
        rank?: number;
      } | null;
    }>,
    summary: {
      totalSubmissions: number;
      totalContests: number;
      averageScore: number;
      completedQuestions: number;
      bestRank?: number;
      problemsByDifficulty: {
        EASY: number;
        MEDIUM: number;
        HARD: number;
      };
    };
  };
  error?: string;
};

export async function GET(request: Request) {
  try {

    // Extract username from URL
    const { url } = request;
    const info = url.split('getProfileDetails/')[1];
    const username = decodeURIComponent(info);

    // Fetch user data with related information
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        leetcodeUsername: true,
        codeforcesUsername: true,
        section: true,
        enrollmentNum: true,
        individualPoints: true,
        profileUrl: true,
        createdAt: true,
        groups: {
          select: {
            id: true,
            name: true,
            groupPoints: true,
            coordinator: {
              select: {
                username: true,
                email: true,
              },
            },
          },
        },
        submissions: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            score: true,
            status: true,
            createdAt: true,
            question: {
              select: {
                id: true,
                leetcodeUrl: true,
                codeforcesUrl: true,
                difficulty: true,
                points: true,
                slug: true,
                questionTags: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            contest: {
              select: {
                id: true,
                name: true,
                startTime: true,
                endTime: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json<UserProfileResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch contest history
    const contestHistory = await prisma.contest.findMany({
      where: {
        submissions: {
          some: {
            userId: user.id,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      select: {
        id: true,
        name: true,
        startTime: true,
        endTime: true,
        status: true,
        submissions: {
          where: {
            userId: user.id,
          },
          select: {
            id: true,
            score: true,
            status: true,
            question: {
              select: {
                slug: true,
                difficulty: true,
                points: true,
              },
            },
          },
        },
        attemptedGroups: user.groups.length > 0 ? {
          where: {
            groupId: { in: user.groups.map((g) => g.id) },
          },
          select: {
            score: true,
            rank: true,
          },
        } : undefined,
      },
    });

    // Calculate summary statistics
    const summary = {
      totalSubmissions: user.submissions.length,
      totalContests: contestHistory.length,
      averageScore: user.submissions.length > 0 
        ? user.submissions.reduce((acc, sub) => acc + sub.score, 0) / user.submissions.length 
        : 0,//@ts-expect-error: it is important her i dont know 
      completedQuestions: user.submissions.filter(sub => sub.status === 'COMPLETED').length,
      bestRank: Math.min(
        ...contestHistory
          .map(contest => contest.attemptedGroups?.[0]?.rank ?? Infinity)
          .filter(rank => rank !== Infinity)
      ),
      problemsByDifficulty: {
        BEGINNER: user.submissions.filter(sub => sub.question.difficulty === 'BEGINNER').length,
        EASY: user.submissions.filter(sub => sub.question.difficulty === 'EASY').length,
        MEDIUM: user.submissions.filter(sub => sub.question.difficulty === 'MEDIUM').length,
        HARD: user.submissions.filter(sub => sub.question.difficulty === 'HARD').length,
        VERYHARD: user.submissions.filter(sub => sub.question.difficulty === 'VERYHARD').length,
      },
    };

    // Transform contest history to include group performance
    const transformedContestHistory = contestHistory.map(contest => ({
      id: contest.id,
      name: contest.name,
      startTime: contest.startTime,
      endTime: contest.endTime,
      status: contest.status,
      submissions: contest.submissions,
      groupPerformance: contest.attemptedGroups?.[0] ? {
        score: contest.attemptedGroups[0].score,
        rank: contest.attemptedGroups[0].rank ?? undefined
      } : null
    }));

    const response: UserProfileResponse = {
      success: true,
      data: {
        user: {
          ...user,
          group: user.groups[0] || null,
          groups: user.groups,
        },
        contests: transformedContestHistory,
        summary: summary,
      },
    };

    return NextResponse.json<UserProfileResponse>(response);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json<UserProfileResponse>(
      {
        success: false,
        error: error instanceof z.ZodError
          ? "Invalid user ID format"
          : "Failed to fetch user profile"
      },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}