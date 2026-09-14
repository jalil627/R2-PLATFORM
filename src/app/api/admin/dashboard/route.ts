import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

export async function GET() {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'overview')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [
      totalGMV,
      platformRevenue,
      totalCreators,
      activeCreators,
      totalBuyers,
      totalOrders,
      totalProducts,
      totalDownloads,
      pendingProducts,
      pendingReports,
      pendingPayouts,
      pendingComplaints,
      paidOrders,
      refundedOrders,
      pendingAlerts,
      gmvLast30,
      gmvPrev30,
      ordersLast30,
      ordersPrev30,
    ] = await Promise.all([
      prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { grossAmount: true } }).then(r => r._sum.grossAmount || 0),
      prisma.transaction.aggregate({ where: { type: 'PLATFORM_FEE' }, _sum: { amount: true } }).then(r => r._sum.amount || 0),
      prisma.creatorProfile.count(),
      prisma.creatorProfile.count({ where: { user: { lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } }),
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.order.count(),
      prisma.product.count(),
      prisma.download.count(),
      prisma.product.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.payout.count({ where: { status: { in: ['REQUESTED', 'PENDING'] } } }),
      prisma.complaint.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
      prisma.order.count({ where: { status: 'PAID' } }),
      prisma.order.count({ where: { status: 'REFUNDED' } }),
      prisma.systemAlert.count({ where: { isRead: false } }),
      prisma.order.aggregate({
        where: { status: 'PAID', createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        _sum: { grossAmount: true },
      }).then(r => r._sum.grossAmount || 0),
      prisma.order.aggregate({
        where: {
          status: 'PAID',
          createdAt: {
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { grossAmount: true },
      }).then(r => r._sum.grossAmount || 0),
      prisma.order.count({
        where: { status: 'PAID', createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.order.count({
        where: {
          status: 'PAID',
          createdAt: {
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0
    const refundRate = paidOrders > 0 ? (refundedOrders / paidOrders) * 100 : 0
    const pct = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? 100 : 0)

    return NextResponse.json({
      success: true,
      data: {
        totalGMV,
        platformRevenue,
        totalCreators,
        activeCreators,
        totalBuyers,
        totalOrders,
        totalProducts,
        totalDownloads,
        conversionRate,
        refundRate,
        gmvDelta: pct(gmvLast30, gmvPrev30),
        ordersDelta: pct(ordersLast30, ordersPrev30),
        pendingProducts,
        pendingReports,
        pendingPayouts,
        pendingComplaints,
        pendingAlerts,
      },
    })
  } catch (error) {
    console.error('[Admin Dashboard]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
