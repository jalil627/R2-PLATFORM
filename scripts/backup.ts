/**
 * SQLite backup: checkpoints the WAL, then copies dev.db to backups/.
 * Usage:  npm run db:backup
 * Restore: stop the server, copy the chosen file back to prisma/dev.db,
 *          delete dev.db-shm / dev.db-wal if present, restart.
 */
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const KEEP_LAST = 14

async function main() {
  const prismaDir = path.join(process.cwd(), 'prisma')
  const dbFile = path.join(prismaDir, 'dev.db')
  if (!fs.existsSync(dbFile)) {
    throw new Error(`Database file not found: ${dbFile}`)
  }

  const prisma = new PrismaClient()
  try {
    // Flush WAL into the main file so the copy is self-contained.
    // (PRAGMA returns rows → queryRaw, not executeRaw.)
    await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);')
  } finally {
    await prisma.$disconnect()
  }

  const dir = path.join(process.cwd(), 'backups')
  fs.mkdirSync(dir, { recursive: true })

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const dest = path.join(dir, `dev-${stamp}.db`)
  fs.copyFileSync(dbFile, dest)

  // Prune old backups, keep the newest KEEP_LAST.
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('dev-') && f.endsWith('.db'))
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)
  for (const old of files.slice(KEEP_LAST)) {
    fs.unlinkSync(path.join(dir, old.f))
  }

  const size = (fs.statSync(dest).size / 1024).toFixed(1)
  console.log(`Backup OK: ${dest} (${size} KB, keeping ${Math.min(files.length + 1, KEEP_LAST)})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
