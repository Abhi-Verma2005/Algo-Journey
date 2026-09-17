import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [],
})

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

export default prisma