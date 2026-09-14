import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient; prismaTuned: boolean }

function createClient(): PrismaClient {
  const client = new PrismaClient()
  // Tune SQLite for concurrent reads (WAL mode, non-blocking readers) so the
  // site stays responsive under load. Runs once per process.
  // Skipped for non-SQLite URLs (e.g. Postgres on Vercel) where PRAGMA is invalid.
  const dbUrl = process.env.DATABASE_URL || ''
  const isSqlite = dbUrl === '' || dbUrl.startsWith('file:')
  if (isSqlite) {
    void client
      .$connect()
      .then(async () => {
        await client.$executeRawUnsafe('PRAGMA journal_mode=WAL;')
        await client.$executeRawUnsafe('PRAGMA synchronous=NORMAL;')
        await client.$executeRawUnsafe('PRAGMA busy_timeout=15000;')
      })
      .catch(() => {})
  }
  return client
}

export const prisma = globalForPrisma.prisma || (globalForPrisma.prisma = createClient())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma