import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: session.user.email, mode: 'insensitive' } },
      select: {
        codeforcesApiKey: true,
        codeforcesApiSecret: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return whether the user has configured their API keys
    return NextResponse.json({
      hasApiKey: !!(user.codeforcesApiKey && user.codeforcesApiSecret),
      apiKey: user.codeforcesApiKey,
      apiSecret: user.codeforcesApiSecret,
    });
  } catch (error) {
    console.error('Error fetching Codeforces API keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiKey, apiSecret } = await req.json();

    // Validate that both fields are provided or both are null (to delete)
    if ((apiKey && !apiSecret) || (!apiKey && apiSecret)) {
      return NextResponse.json(
        { error: 'Both API key and secret must be provided together' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: session.user.email, mode: 'insensitive' } },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        codeforcesApiKey: apiKey || null,
        codeforcesApiSecret: apiSecret || null,
      },
      select: {
        codeforcesApiKey: true,
        codeforcesApiSecret: true,
      },
    });

    return NextResponse.json({
      message: apiKey ? 'API keys updated successfully' : 'API keys removed successfully',
      hasApiKey: !!(updatedUser.codeforcesApiKey && updatedUser.codeforcesApiSecret),
    });
  } catch (error) {
    console.error('Error updating Codeforces API keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
