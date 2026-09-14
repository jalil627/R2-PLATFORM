import type { PrismaClient as PrismaClientType } from '@prisma/client'
import type { Prisma } from '@prisma/client'

type Db = PrismaClientType
type Tx = Prisma.TransactionClient

const KEY = 'last_member_no'

export async function reserveMemberNo(db: Db | Tx): Promise<number> {
  const setting = await db.platformSetting.findUnique({ where: { key: KEY } })
  const next = Number((setting?.value as unknown) || 0) + 1
  await db.platformSetting.upsert({
    where: { key: KEY },
    update: { value: next },
    create: { key: KEY, value: next },
  })
  return next
}