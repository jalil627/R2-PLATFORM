import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

const validStatuses = ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'orders')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true, email: true, avatar: true } },
        seller: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        items: { include: { product: { select: { id: true, title: true, thumbnail: true, type: true, price: true } } } },
        payment: { select: { provider: true, status: true, providerPaymentId: true, metadata: true, amount: true } },
        coupon: { select: { code: true, discountType: true, discountValue: true } },
        refunds: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('[Admin Order GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const patchSessionUser = getSessionUser(session)
    if (!patchSessionUser || !canAccessSection(patchSessionUser.role, 'orders')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, notes } = body

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
    }

    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    const updateData: Prisma.OrderUpdateInput = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        buyer: { select: { name: true, email: true } },
        seller: { include: { user: { select: { name: true, email: true } } } },
      },
    })

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('[Admin Order PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}