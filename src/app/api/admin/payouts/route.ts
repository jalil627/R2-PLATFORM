import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'payouts')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('q') || ''
    const status = searchParams.get('status') || ''
    const sort = searchParams.get('sort') || 'createdAt'

    const where: Prisma.PayoutWhereInput = {}
    if (search) {
      where.OR = [
        { creator: { user: { name: { contains: search } } } },
        { creator: { user: { email: { contains: search } } } },
        { providerPayoutId: { contains: search } },
      ]
    }
    if (status) where.status = status as Prisma.PayoutWhereInput['status']

    const orderBy: Prisma.PayoutOrderByWithRelationInput = (() => {
      switch (sort) {
        case 'amount': return { amount: 'desc' }
        case 'status': return { status: 'asc' }
        case 'createdAt':
        default: return { createdAt: 'desc' }
      }
    })()

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          creator: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      }),
      prisma.payout.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: payouts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('[Admin Payouts GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}