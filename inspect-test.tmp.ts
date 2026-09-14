import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const orders = await prisma.order.findMany({ select: { id: true, orderNumber: true, status: true, grossAmount: true, buyerId: true, sellerId: true } })
  console.log(`ORDERS: ${orders.length}`)
  for (const o of orders) {
    const [items, payments, txs, notifs] = await Promise.all([
      prisma.orderItem.findMany({ where: { orderId: o.id }, select: { id: true, productId: true, price: true } }),
      prisma.payment.findMany({ where: { orderId: o.id }, select: { id: true, provider: true, status: true, amount: true } }),
      prisma.transaction.findMany({ where: { orderId: o.id }, select: { id: true, type: true, amount: true } }),
      prisma.notification.findMany({ where: { message: { contains: o.orderNumber } }, select: { id: true, title: true } }),
    ])
    console.log(`- ${o.orderNumber} [${o.status}] ${o.grossAmount}: items=${items.length} payments=${payments.length} txs=${txs.length} notifs=${notifs.length}`)
    for (const i of items) console.log(`    item: product=${i.productId} price=${i.price}`)
  }
  const [downloads, creators] = await Promise.all([
    prisma.download.findMany({ select: { id: true, userId: true, productId: true, downloadedAt: true } }),
    prisma.creatorProfile.findMany({ select: { id: true, pendingBalance: true, availableBalance: true, totalEarnings: true, totalSales: true } }),
  ])
  console.log(`DOWNLOADS(${downloads.length}):`, JSON.stringify(downloads))
  console.log('CREATORS:', JSON.stringify(creators))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
