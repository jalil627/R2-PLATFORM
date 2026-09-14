import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // One-time repair: users who completed a Google OAuth flow proved address
  // ownership, so a null emailVerified wrongly locks them out. Only touches
  // rows with a linked google account.
  const result = await prisma.user.updateMany({
    where: { emailVerified: null, accounts: { some: { provider: 'google' } } },
    data: { emailVerified: new Date() },
  })
  console.log(`repaired: ${result.count} user(s)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
