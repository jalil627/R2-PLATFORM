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
    if (!sessionUser || !canAccessSection(sessionUser.role, 'affiliates')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { isActive, commissionRate } = body

    const existing = await prisma.affiliateLink.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 100)) {
      return NextResponse.json({ error: 'نسبة العمولة يجب أن تكون بين 0 و 100' }, { status: 400 })
    }

    const updateData: Prisma.AffiliateLinkUpdateInput = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate

    const link = await prisma.affiliateLink.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { title: true } },
      },
    })

    return NextResponse.json({ success: true, data: link })
  } catch (error) {
    console.error('[Admin Affiliate PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}