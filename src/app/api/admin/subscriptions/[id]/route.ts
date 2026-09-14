import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'
import { getPlatformSettings } from '@/lib/plans'

interface PlanPurchasePatchBody {
  status?: unknown
  adminNote?: unknown
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'subscriptions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.planPurchase.findUnique({ where: { id }, include: { user: { select: { id: true, name: true } } } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'الطلب غير موجود' }, { status: 404 })
    }

    let body: PlanPurchasePatchBody = {}
    try { body = await request.json() as PlanPurchasePatchBody } catch {}
    const status = String(body.status || '').toUpperCase()
    const adminNote = body.adminNote !== undefined ? String(body.adminNote).trim() : undefined

    if (!['PAID', 'REJECTED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'حالة غير صالحة' }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (status === 'PAID') {
        const settings2 = await getPlatformSettings()
        const days = Number(settings2.plan_days || 30)
        const profile = await tx.creatorProfile.findUnique({ where: { userId: existing.userId } })
        const base = profile?.planExpiresAt && profile.planExpiresAt.getTime() > Date.now()
          ? profile.planExpiresAt
          : new Date()
        const planExpiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000)

        await tx.creatorProfile.upsert({
          where: { userId: existing.userId },
          update: { plan: 'PRO', planExpiresAt },
          create: { userId: existing.userId, plan: 'PRO', planExpiresAt, commissionRate: parseFloat(process.env.PLATFORM_FEE_PERCENT || String(settings2.platform_fee_percent || 10)) },
        })

        await tx.notification.create({
          data: {
            userId: existing.userId,
            type: 'SYSTEM',
            title: 'تم تفعيل خطة برو',
            message: `تم تفعيل اشتراكك في خطة برو لمدة ${days} يومًا. استمتع بمنتجات غير محدودة وكوبونات وإحصائيات متقدمة.`,
            link: '/creator/dashboard',
          },
        })
      } else {
        await tx.notification.create({
          data: {
            userId: existing.userId,
            type: 'SYSTEM',
            title: 'لم يتم تأكيد اشتراكك',
            message: adminNote || 'تعذر تأكيد دفعة الاشتراك. راجع بيانات الدفع أو تواصل مع الدعم.',
            link: '/creator/plans',
          },
        })
      }

      return tx.planPurchase.update({
        where: { id },
        data: {
          status,
          paidAt: status === 'PAID' ? new Date() : null,
          ...(adminNote !== undefined ? { adminNote: adminNote || null } : {}),
        },
      })
    })

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: 'UPDATE_PLAN_PURCHASE',
        entity: 'PlanPurchase',
        entityId: id,
        newValues: { status, adminNote },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[Admin Subscriptions PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}