import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const VALID = ['SALE', 'PLATFORM_FEE', 'PAYMENT_FEE', 'SELLER_EARNING', 'REFUND', 'PAYOUT', 'ADJUSTMENT']

async function main() {
  const junk = await prisma.transaction.findMany({
    where: { NOT: { type: { in: VALID as never[] } } },
    select: { id: true, type: true, amount: true, description: true, orderId: true, createdAt: true },
  })
  console.log(`FOUND ${junk.length} invalid-type rows:`)
  for (const t of junk) console.log(`- ${t.type} ${t.amount} | ${t.description} | order=${t.orderId} | ${t.createdAt.toISOString()}`)

  const linked = junk.filter((t) => t.orderId)
  if (linked.length > 0) throw new Error('REFUSING: some junk rows are linked to orders')

  const res = await prisma.transaction.deleteMany({ where: { NOT: { type: { in: VALID as never[] } } } })
  console.log(`DELETED ${res.count} fake-money rows`)

  const remaining = await prisma.transaction.groupBy({ by: ['type'], _sum: { amount: true }, _count: { _all: true } })
  console.log('REMAINING:', JSON.stringify(remaining))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
