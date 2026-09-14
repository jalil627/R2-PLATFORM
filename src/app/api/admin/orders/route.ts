import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'orders')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('q') || ''
    const status = searchParams.get('status') || ''
    const sort = searchParams.get('sort') || 'createdAt'

    const where: Prisma.OrderWhereInput = {}
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { buyer: { name: { contains: search } } },
        { buyer: { email: { contains: search } } },
        { seller: { user: { name: { contains: search } } } },
        { seller: { user: { email: { contains: search } } } },
      ]
    }
    if (status) where.status = status as Prisma.OrderWhereInput['status']

    const orderBy: Prisma.OrderOrderByWithRelationInput = (() => {
      switch (sort) {
        case 'orderNumber': return { orderNumber: 'asc' }
        case 'grossAmount': return { grossAmount: 'desc' }
        case 'status': return { status: 'asc' }
        case 'createdAt':
        default: return { createdAt: 'desc' }
      }
    })()

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          seller: { include: { user: { select: { id: true, name: true, email: true } } } },
          items: { include: { product: { select: { id: true, title: true, thumbnail: true } } } },
          payment: { select: { provider: true, status: true, providerPaymentId: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('[Admin Orders GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}