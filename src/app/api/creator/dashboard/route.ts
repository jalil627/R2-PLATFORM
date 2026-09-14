import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { getCreatorPlanStatus } from '@/lib/plans'

export async function GET() {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = sessionUser.id
    const creator = await prisma.creatorProfile.findUnique({ where: { userId } })

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      thisMonthOrders,
      lastMonthOrders,
      recentOrders,
      topProducts,
      dailyRevenue,
    ] = await Promise.all([
      prisma.product.count({ where: { creatorId: creator.id } }),
      prisma.order.count({ where: { sellerId: creator.id, status: 'PAID' } }),
      prisma.order.findMany({
        where: { sellerId: creator.id, status: 'PAID' },
        select: { buyerId: true },
        distinct: ['buyerId'],
      }).then(orders => orders.length),
      prisma.order.findMany({
        where: { sellerId: creator.id, status: 'PAID', createdAt: { gte: thisMonthStart } },
        select: { grossAmount: true },
      }).then(orders => ({ count: orders.length, revenue: orders.reduce((s, o) => s + o.grossAmount, 0) })),
      prisma.order.findMany({
        where: { sellerId: creator.id, status: 'PAID', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
        select: { grossAmount: true },
      }).then(orders => ({ count: orders.length, revenue: orders.reduce((s, o) => s + o.grossAmount, 0) })),
      prisma.order.findMany({
        where: { sellerId: creator.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          buyer: { select: { name: true, email: true, avatar: true } },
          items: { include: { product: { select: { title: true, thumbnail: true } } } },
        },
      }),
      prisma.product.findMany({
        where: { creatorId: creator.id },
        orderBy: { downloadCount: 'desc' },
        take: 5,
        select: { id: true, title: true, thumbnail: true, downloadCount: true, price: true, rating: true },
      }),
      prisma.order.findMany({
        where: { sellerId: creator.id, status: 'PAID' },
        select: { createdAt: true, grossAmount: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const revenueChange = lastMonthOrders.revenue > 0
      ? ((thisMonthOrders.revenue - lastMonthOrders.revenue) / lastMonthOrders.revenue) * 100
      : 0
    const ordersChange = lastMonthOrders.count > 0
      ? ((thisMonthOrders.count - lastMonthOrders.count) / lastMonthOrders.count) * 100
      : 0

    return NextResponse.json({
      success: true,
      data: {
        plan: getCreatorPlanStatus(creator),
        stats: {
          totalRevenue: creator.totalEarnings,
          totalOrders,
          totalProducts,
          totalCustomers,
          pendingBalance: creator.pendingBalance,
          availableBalance: creator.availableBalance,
          revenueChange,
          ordersChange,
          thisMonth: thisMonthOrders,
        },
        recentOrders,
        topProducts,
        dailyRevenue: dailyRevenue.map(d => ({
          date: d.createdAt.toISOString().split('T')[0],
          amount: d.grossAmount,
        })),
      },
    })
  } catch (error) {
    console.error('[Creator Dashboard]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
