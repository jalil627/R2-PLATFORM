import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = sessionUser.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, avatar: true },
    })
    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('[Me GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    const patchSessionUser = getSessionUser(session)
    if (!patchSessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = patchSessionUser.id
    const body = await request.json()
    const { name, currentPassword, newPassword, role, avatar } = body

    if (avatar !== undefined) {
      await prisma.user.update({ where: { id: userId }, data: { avatar: String(avatar) } })
      return NextResponse.json({ success: true, data: { avatar: String(avatar) } })
    }

    if (role === 'BUYER') {
      const current = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
      if (current?.role === 'BUYER') {
        return NextResponse.json({ success: false, error: 'حسابك مشتري بالفعل' }, { status: 400 })
      }
      if (current?.role === 'ADMIN' || current?.role === 'SUPER_ADMIN') {
        return NextResponse.json({ success: false, error: 'لا يمكن تحويل حساب إداري إلى مشتري' }, { status: 400 })
      }
      await prisma.user.update({ where: { id: userId }, data: { role: 'BUYER' } })
      return NextResponse.json({ success: true, data: { role: 'BUYER' } })
    }

    if (name !== undefined) {
      const clean = String(name).trim()
      if (clean.length < 2) {
        return NextResponse.json({ success: false, error: 'الاسم قصير جدًا' }, { status: 400 })
      }
      await prisma.user.update({ where: { id: userId }, data: { name: clean } })
      return NextResponse.json({ success: true, data: { name: clean } })
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, error: 'كلمة المرور الحالية مطلوبة' }, { status: 400 })
      }
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user?.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        return NextResponse.json({ success: false, error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'كلمة المرور الجديدة قصيرة جدًا (6 أحرف على الأقل)' }, { status: 400 })
      }
      const passwordHash = await bcrypt.hash(newPassword, 10)
      await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'لا توجد بيانات للتحديث' }, { status: 400 })
  } catch (error) {
    console.error('[Me PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    const deleteSessionUser = getSessionUser(session)
    if (!deleteSessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = deleteSessionUser.id
    const { currentPassword } = await request.json()

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.passwordHash) {
      return NextResponse.json({ success: false, error: 'لا يمكن حذف هذا الحساب، أعد تسجيل الدخول' }, { status: 400 })
    }
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return NextResponse.json({ success: false, error: 'كلمة المرور غير صحيحة' }, { status: 400 })
    }

    const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId } })
    const creatorProfileId = creatorProfile?.id

    await prisma.$transaction(async (tx) => {
      if (creatorProfileId) {
        await tx.product.deleteMany({ where: { creatorId: creatorProfileId } })
        await tx.payout.deleteMany({ where: { creatorId: creatorProfileId } })
        await tx.coupon.deleteMany({ where: { creatorId: creatorProfileId } })
        await tx.creatorAnalytics.deleteMany({ where: { creatorId: creatorProfileId } })
        await tx.order.deleteMany({ where: { sellerId: creatorProfileId } })
      }
      await tx.user.delete({ where: { id: userId } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Me DELETE]', error)
    return NextResponse.json({ success: false, error: 'تعذر حذف الحساب، حاول لاحقًا' }, { status: 500 })
  }
}