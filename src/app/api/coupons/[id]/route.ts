import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'

const CREATOR_ROLES = ['CREATOR', 'ADMIN', 'SUPER_ADMIN']

async function getCreatorProfileId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, creatorProfile: { select: { id: true } } },
  })
  return user && CREATOR_ROLES.includes(user.role) ? user.creatorProfile?.id ?? null : null
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'غير مصرّح' }, { status: 401 })
    }
    const userId = sessionUser.id
    const profileId = await getCreatorProfileId(userId)
    if (!profileId) {
      return NextResponse.json({ success: false, error: 'يجب أن تكون مبدعًا' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { isActive } = body

    const coupon = await prisma.coupon.findFirst({ where: { id, creatorId: profileId } })
    if (!coupon) {
      return NextResponse.json({ success: false, error: 'الكوبون غير موجود' }, { status: 404 })
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: { ...(isActive !== undefined && { isActive: Boolean(isActive) }) },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[Coupon PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const deleteSessionUser = getSessionUser(session)
    if (!deleteSessionUser) {
      return NextResponse.json({ success: false, error: 'غير مصرّح' }, { status: 401 })
    }
    const userId = deleteSessionUser.id
    const profileId = await getCreatorProfileId(userId)
    if (!profileId) {
      return NextResponse.json({ success: false, error: 'يجب أن تكون مبدعًا' }, { status: 403 })
    }

    const { id } = await params
    const coupon = await prisma.coupon.findFirst({ where: { id, creatorId: profileId } })
    if (!coupon) {
      return NextResponse.json({ success: false, error: 'الكوبون غير موجود' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.couponUsage.deleteMany({ where: { couponId: id } }),
      prisma.coupon.delete({ where: { id } }),
    ])

    return NextResponse.json({ success: true, message: 'تم حذف الكوبون' })
  } catch (error) {
    console.error('[Coupon DELETE]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
