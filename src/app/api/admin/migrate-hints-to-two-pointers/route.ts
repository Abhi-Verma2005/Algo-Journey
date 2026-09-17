import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

function createSSEStream() {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  
  return {
    stream: stream.readable,
    //@ts-expect-error: not needed here
    write: async (event: string, data) => {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ type: event, data })}\n\n`)
      );
    },
    close: () => writer.close()
  };
}

export async function GET() {
  
  const sse = createSSEStream();
  
  const backgroundTask = async () => {
    try {
      let twoPointersTag = await prisma.questionTag.findUnique({
        where: { name: "Two Pointers" }
      });
      
      if (!twoPointersTag) {
        twoPointersTag = await prisma.questionTag.create({
          data: { name: "Two Pointers" }
        });
      }
      
      await sse.write('status', 'Starting migration...');
      
      const existingHints = await prisma.hint.findMany({
        include: { question: true }
      });
      
      const totalHints = existingHints.length;
      await sse.write('status', `Found ${totalHints} existing hints to migrate`);
      
      let migratedCount = 0;
      
      for (const hint of existingHints) {

        const existingTagHint = await prisma.tagHint.findUnique({
          where: {
            questionId_tagId: {
              questionId: hint.questionId,
              tagId: twoPointersTag.id
            }
          }
        });
        
        if (!existingTagHint) {
          const tagHint = await prisma.tagHint.create({
            data: {
              question: { connect: { id: hint.questionId } },
              tag: { connect: { id: twoPointersTag.id } }
            }
          });
          
          await prisma.hintnew.createMany({
            data: [
              {
                tagHintId: tagHint.id,
                content: hint.hint1,
                sequence: 1
              },
              {
                tagHintId: tagHint.id,
                content: hint.hint2,
                sequence: 2
              },
              {
                tagHintId: tagHint.id,
                content: hint.hint3,
                sequence: 3
              }
            ]
          });
          
          migratedCount++;
        }
        
        if (migratedCount % 5 === 0 || migratedCount === totalHints) {
          await sse.write('progress', {
            total: totalHints,
            migrated: migratedCount,
            currentQuestion: hint.questionId
          });
        }
      }
      
      await sse.write('complete', {
        message: `Migration completed. Migrated ${migratedCount} questions' hints to Two Pointers tag.`,
        migratedCount
      });
      
    } catch (error) {
      console.error('Error during migration:', error);
      await sse.write('error', {
        message: 'Error during migration',
        error: error
      });
    } finally {
      await sse.close();
    }
  };
  
  backgroundTask();
  
  return new NextResponse(sse.stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}