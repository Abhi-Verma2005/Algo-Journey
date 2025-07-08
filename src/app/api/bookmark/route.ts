import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userEmail = session.user.email;
    const body = await request.json();
    const { questionId, action } = body;
    
    if (!questionId || !action) {
      return NextResponse.json(
        { error: 'Invalid input: questionId and action are required' },
        { status: 400 }
      );
    }
      
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'add') {
      const bookmark = await prisma.bookmark.upsert({
        where: {
          userId_questionId: {
            userId: user.id,
            questionId
          }
        },
        update: {},
        create: {
          userId: user.id,
          questionId
        }
      });
      
      return NextResponse.json({ 
        message: 'Question bookmarked successfully',
        bookmark 
      });
    } 
    else if (action === 'remove') {
      await prisma.bookmark.delete({
        where: {
          userId_questionId: {
            userId: user.id,
            questionId
          }
        }
      });
      
      return NextResponse.json({ message: 'Bookmark removed successfully' });
    }
    
    return NextResponse.json(
      { error: 'Invalid action: must be "add" or "remove"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error managing bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to manage bookmark' },
      { status: 500 }
    );
  }
}