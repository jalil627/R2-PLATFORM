import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const googleAccounts = await prisma.account.findMany({
    where: { provider: 'google' },
    include: { user: { select: { id: true, email: true, emailVerified: true, memberNo: true, isActive: true, isBanned: true } } },
  })
  console.log(`google-linked accounts: ${googleAccounts.length}`)
  for (const a of googleAccounts) {
    console.log(`- ${a.user.email} emailVerified=${a.user.emailVerified} memberNo=${a.user.memberNo} active=${a.user.isActive} banned=${a.user.isBanned}`)
  }
  const nullVerified = await prisma.user.count({ where: { emailVerified: null } })
  const total = await prisma.user.count()
  console.log(`users: ${total} total, ${nullVerified} with emailVerified=null`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
