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
    if (!sessionUser || !canAccessSection(sessionUser.role, 'creators')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { isVerified, commissionRate } = body

    const existing = await prisma.creatorProfile.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 100)) {
      return NextResponse.json({ error: 'نسبة العمولة يجب أن تكون بين 0 و 100' }, { status: 400 })
    }

    const updateData: Prisma.CreatorProfileUpdateInput = {}
    if (isVerified !== undefined) {
      updateData.isVerified = isVerified
      updateData.verifiedAt = isVerified ? new Date() : null
    }
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate

    const creator = await prisma.creatorProfile.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { name: true, email: true, store: { select: { name: true } } } },
      },
    })

    return NextResponse.json({ success: true, data: creator })
  } catch (error) {
    console.error('[Admin Creator PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}