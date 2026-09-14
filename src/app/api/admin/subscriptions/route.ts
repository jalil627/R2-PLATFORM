import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'subscriptions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))
    const status = searchParams.get('status') || ''
    const q = searchParams.get('q') || ''
    const view = searchParams.get('view') || ''

    const pendingCount = await prisma.planPurchase.count({ where: { status: 'PENDING' } })

    if (view === 'active') {
      const now = new Date()
      const activeProfiles = await prisma.creatorProfile.findMany({
        where: { plan: 'PRO', OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: now } }] },
        orderBy: [{ planExpiresAt: 'desc' }],
        include: { user: { select: { id: true, name: true, email: true, memberNo: true, createdAt: true } } },
      })
      const rows = activeProfiles.map(p => ({
        id: p.id,
        userId: p.userId,
        memberNo: p.user?.memberNo,
        name: p.user?.name,
        email: p.user?.email,
        plan: 'PRO',
        planExpiresAt: p.planExpiresAt,
        daysLeft: p.planExpiresAt ? Math.max(0, Math.ceil((p.planExpiresAt.getTime() - now.getTime()) / 86400000)) : -1,
        since: p.user?.createdAt,
      }))
      return NextResponse.json({
        success: true,
        view: 'active',
        data: rows,
        total: rows.length,
        page: 1,
        pageSize: rows.length,
        totalPages: 1,
        pendingCount,
      })
    }

    const where: Prisma.PlanPurchaseWhereInput = {}
    if (status) where.status = status
    if (q) {
      where.OR = [
        { user: { name: { contains: q } } },
        { user: { email: { contains: q.toLowerCase() } } },
        { reference: { contains: q } },
      ]
    }

    const [purchases, total] = await Promise.all([
      prisma.planPurchase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, name: true, email: true, memberNo: true } } },
      }),
      prisma.planPurchase.count({ where }),
    ])

    return NextResponse.json({ success: true, data: purchases, total, page, pageSize, pendingCount, totalPages: Math.ceil(total / pageSize) })
  } catch (error) {
    console.error('[Admin Subscriptions GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}