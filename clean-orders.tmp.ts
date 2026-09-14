import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const orders = await prisma.order.findMany({
    select: { id: true, orderNumber: true, status: true, grossAmount: true, buyerId: true, sellerId: true },
  })
  console.log(`Deleting ${orders.length} test order(s)...`)
  const orderIds = orders.map((o) => o.id)
  const orderNumbers = orders.map((o) => o.orderNumber)

  // Product download counters bumped by the test settlement
  const items = await prisma.orderItem.findMany({ where: { orderId: { in: orderIds } }, select: { productId: true } })
  const productIds = [...new Set(items.map((i) => i.productId))]

  // Ledger + coupon usages tied to the test orders
  const txDel = await prisma.transaction.deleteMany({ where: { orderId: { in: orderIds } } })
  const cuDel = await prisma.couponUsage.deleteMany({ where: { orderId: { in: orderIds } } })

  // The single test-purchase download (same buyer+product as the PAID order)
  const paid = orders.find((o) => o.status === 'PAID')
  let dlDel = 0
  if (paid) {
    const dl = await prisma.download.deleteMany({
      where: { userId: paid.buyerId, productId: { in: productIds } },
    })
    dlDel = dl.count
  }

  // Notifications referencing the test order numbers
  let nDel = 0
  for (const n of orderNumbers) {
    const r = await prisma.notification.deleteMany({ where: { message: { contains: n } } })
    nDel += r.count
  }

  // Orders (cascades: items, payments, refunds)
  const oDel = await prisma.order.deleteMany({ where: { id: { in: orderIds } } })

  // Reset test-inflated counters
  for (const pid of productIds) {
    const p = await prisma.product.findUnique({ where: { id: pid }, select: { downloadCount: true } })
    if (p && p.downloadCount > 0) {
      await prisma.product.update({ where: { id: pid }, data: { downloadCount: p.downloadCount - 1 } })
    }
  }
  const cUpd = await prisma.creatorProfile.updateMany({
    data: { pendingBalance: 0, availableBalance: 0, totalEarnings: 0, totalSales: 0 },
  })

  console.log(`txs=${txDel.count} couponUsages=${cuDel.count} downloads=${dlDel} notifs=${nDel} orders=${oDel.count} creatorsReset=${cUpd.count}`)

  const [o2, t2, p2, bal] = await Promise.all([
    prisma.order.count(),
    prisma.transaction.count(),
    prisma.payment.count(),
    prisma.creatorProfile.aggregate({ _sum: { pendingBalance: true, availableBalance: true, totalEarnings: true } }),
  ])
  console.log(`AFTER: orders=${o2} txs=${t2} payments=${p2} balances=${JSON.stringify(bal._sum)}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
