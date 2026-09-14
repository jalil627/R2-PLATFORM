import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const [orders, txs, payouts, refunds, payments, creators] = await Promise.all([
    prisma.order.findMany({ select: { id: true, orderNumber: true, status: true, grossAmount: true, createdAt: true } }),
    prisma.transaction.findMany({ select: { id: true, type: true, amount: true, description: true, orderId: true, createdAt: true } }),
    prisma.payout.findMany({ include: { creator: { include: { user: { select: { email: true } } } } } }),
    prisma.refund.findMany(),
    prisma.payment.findMany({ select: { id: true, orderId: true, amount: true, provider: true, status: true } }),
    prisma.creatorProfile.findMany({ select: { id: true, userId: true, pendingBalance: true, availableBalance: true, totalEarnings: true, totalSales: true, payoutMethod: true } }),
  ])
  console.log(`ORDERS(${orders.length}):`, JSON.stringify(orders.slice(0, 20)))
  console.log(`TXS(${txs.length}):`, JSON.stringify(txs.slice(0, 20)))
  console.log(`PAYOUTS(${payouts.length}):`, JSON.stringify(payouts))
  console.log(`REFUNDS(${refunds.length}) PAYMENTS(${payments.length}):`, JSON.stringify(payments))
  console.log('CREATORS:', JSON.stringify(creators))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
