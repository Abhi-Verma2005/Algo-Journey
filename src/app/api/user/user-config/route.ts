import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// GET: Fetch existing config or auto-create default if missing
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userEmail = session.user.email

  try {
    let existing = await prisma.userConfig.findFirst({
      where: { userEmail: { equals: userEmail, mode: 'insensitive' } },
    })

    if (!existing) {
      // Auto-initialize config so user is properly synced
      existing = await prisma.userConfig.create({
        data: {
          userEmail,
          leetcode_questions_solved: 0,
          codeforces_questions_solved: 0,
          rank: 'novice_1',
        },
      })
    }

    return NextResponse.json(existing)
  } catch (error) {
    console.error('GET /user-config error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST: Create config manually (e.g. admin or debug case)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { leetcode_questions_solved, codeforces_questions_solved, rank, user_brief } = body
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email

    const config = await prisma.userConfig.upsert({
      where: { userEmail },
      update: {
        leetcode_questions_solved: leetcode_questions_solved ?? 0,
        codeforces_questions_solved: codeforces_questions_solved ?? 0,
        rank: rank || undefined,
        user_brief: user_brief || undefined,
      },
      create: {
        userEmail,
        leetcode_questions_solved: leetcode_questions_solved ?? 0,
        codeforces_questions_solved: codeforces_questions_solved ?? 0,
        rank: rank || 'novice_1',
        user_brief: user_brief || undefined,
      },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('POST /user-config error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH: Update existing config (partial update)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { ...updates } = body
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email

    const updated = await prisma.userConfig.upsert({
      where: { userEmail },
      update: updates,
      create: {
        userEmail,
        leetcode_questions_solved: updates.leetcode_questions_solved ?? 0,
        codeforces_questions_solved: updates.codeforces_questions_solved ?? 0,
        rank: updates.rank || 'novice_1',
        user_brief: updates.user_brief,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /user-config error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}