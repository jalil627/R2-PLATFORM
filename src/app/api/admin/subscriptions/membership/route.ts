import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'subscriptions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const userId = String(body.userId || '')
    const action = String(body.action || '')

    if (!userId || !['ACTIVATE', 'EXTEND', 'REVOKE'].includes(action)) {
      return NextResponse.json({ success: false, error: 'بيانات غير صالحة' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } })
    if (!target) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
    }

    const days = Math.max(1, parseInt(body.days) || 30)

    const profile = await prisma.$transaction(async (tx) => {
      if (action === 'REVOKE') {
        const updated = await tx.creatorProfile.upsert({
          where: { userId },
          update: { plan: 'FREE', planExpiresAt: null },
          create: { userId, plan: 'FREE', planExpiresAt: null },
        })
        await tx.notification.create({
          data: {
            userId,
            type: 'SYSTEM',
            title: 'تم إيقاف اشتراك برو',
            message: body.note ? String(body.note).trim() : 'تم إيقاف اشتراكك في خطة برو من طرف الإدارة.',
            link: '/creator/dashboard',
          },
        })
        return updated
      }

      const current = await tx.creatorProfile.findUnique({ where: { userId } })
      const base = action === 'EXTEND' && current?.planExpiresAt && current.planExpiresAt.getTime() > Date.now()
        ? current.planExpiresAt
        : new Date()
      const planExpiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000)

      const updated = await tx.creatorProfile.upsert({
        where: { userId },
        update: { plan: 'PRO', planExpiresAt },
        create: { userId, plan: 'PRO', planExpiresAt },
      })

      await tx.notification.create({
        data: {
          userId,
          type: 'SYSTEM',
          title: action === 'ACTIVATE' ? 'تم تفعيل خطة برو' : 'تم تمديد اشتراك برو',
          message: action === 'ACTIVATE'
            ? `قامت الإدارة بتفعيل اشتراكك في خطة برو لمدة ${days} يومًا.`
            : `تم تمديد اشتراكك في خطة برو لمدة ${days} يومًا إضافيًا.`,
          link: '/creator/dashboard',
        },
      })
      return updated
    })

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: action,
        entity: 'CreatorProfile',
        entityId: userId,
        newValues: { days, note: body.note || undefined },
      },
    })

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('[Admin Membership PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}