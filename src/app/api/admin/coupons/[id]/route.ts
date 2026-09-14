import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'coupons')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { isActive, discountValue, maxUses, expiresAt } = body

    const existing = await prisma.coupon.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    const updateData: Prisma.CouponUpdateInput = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (discountValue !== undefined) updateData.discountValue = discountValue
    if (maxUses !== undefined) updateData.maxUses = maxUses
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
      include: {
        creator: { include: { user: { select: { name: true, email: true } } } },
        product: { select: { title: true } },
        _count: { select: { usages: true } },
      },
    })

    return NextResponse.json({ success: true, data: coupon })
  } catch (error) {
    console.error('[Admin Coupon PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}