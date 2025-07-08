import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'

// GET: Fetch existing config only
export async function GET() {
  const session = await getServerSession()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Missing userEmail' }, { status: 400 })
  }

  const userEmail = session.user.email

  try {
    const existing = await prisma.userConfig.findUnique({
      where: { userEmail },
    })

    if (existing) {
      return NextResponse.json(existing)
    } else {
      // Config doesn't exist yet; let client decide whether to create via POST
      return NextResponse.json({ message: 'Config not found' }, { status: 200 })
    }
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
    const session = await getServerSession()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Missing userEmail' }, { status: 400 })
  }

  const userEmail = session.user.email


    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })
    }

    const created = await prisma.userConfig.create({
      data: {
        userEmail,
        leetcode_questions_solved: leetcode_questions_solved ?? 0,
        codeforces_questions_solved: codeforces_questions_solved ?? 0,
        rank,
        user_brief,
      },
    })

    return NextResponse.json(created)
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
    const session = await getServerSession()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Missing userEmail' }, { status: 401 })
  }

  const userEmail = session.user.email


    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })
    }

    const updated = await prisma.userConfig.update({
      where: { userEmail },
      data: updates,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /user-config error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}