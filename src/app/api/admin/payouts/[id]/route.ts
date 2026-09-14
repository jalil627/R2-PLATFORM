import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'
import { raiseAlert } from '@/lib/alerts'

const validStatuses = ['REQUESTED', 'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'payouts')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const payout = await prisma.payout.findUnique({
      where: { id },
      include: {
        creator: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
      },
    })

    if (!payout) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: payout })
  } catch (error) {
    console.error('[Admin Payout GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let alertId = ''
  try {
    const session = await auth()
    const patchSessionUser = getSessionUser(session)
    if (!patchSessionUser || !canAccessSection(patchSessionUser.role, 'payouts')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    alertId = id
    const body = await request.json()
    const { status, notes, providerPayoutId } = body

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
    }

    const existing = await prisma.payout.findUnique({
      where: { id },
      include: { creator: { include: { user: { select: { id: true } } } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    const terminal = ['PAID', 'FAILED', 'CANCELLED'] as const
    if (terminal.includes(existing.status as (typeof terminal)[number])) {
      return NextResponse.json({ error: 'هذا الطلب مغلق ولا يمكن تعديله' }, { status: 409 })
    }

    // Marking PAID means real money left the platform — an external transfer
    // reference is mandatory so every payout is traceable.
    if (status === 'PAID' && !(providerPayoutId || existing.providerPayoutId)) {
      return NextResponse.json({ success: false, error: 'أدخل مرجع التحويل الخارجي قبل اعتماد الدفع' }, { status: 400 })
    }

    const updateData: Prisma.PayoutUpdateInput = {}
    if (status) {
      updateData.status = status
      if (status === 'PAID' && !existing.processedAt) {
        updateData.processedAt = new Date()
      }
    }
    if (notes !== undefined) updateData.notes = notes
    if (providerPayoutId !== undefined) updateData.providerPayoutId = providerPayoutId

    const payout = await prisma.$transaction(async (tx) => {
      const updated = await tx.payout.update({
        where: { id },
        data: updateData,
        include: {
          creator: { include: { user: { select: { name: true, email: true } } } },
        },
      })

      // Rejected/failed payouts return the money to the creator's balance with
      // a compensating ledger entry so the treasury stays balanced.
      if (status === 'FAILED' || status === 'CANCELLED') {
        await tx.creatorProfile.update({
          where: { id: existing.creatorId },
          data: { availableBalance: { increment: existing.amount } },
        })
        await tx.transaction.create({
          data: {
            type: 'PAYOUT',
            userId: existing.creator.userId,
            amount: existing.amount,
            currency: 'DZD',
            description: `استرداد: ${status === 'CANCELLED' ? 'إلغاء' : 'فشل'} سحب ${existing.id}`,
          },
        })
      }

      return updated
    })

    const statusLabels: Record<string, string> = {
      PENDING: 'قيد الانتظار',
      PROCESSING: 'قيد المعالجة',
      PAID: 'تم الدفع',
      FAILED: 'فشل الدفع',
      CANCELLED: 'ملغي',
    }
    if (status && statusLabels[status]) {
      await prisma.notification.create({
        data: {
          userId: existing.creator.userId,
          type: 'PAYOUT_UPDATE',
          title: 'تحديث على طلب السحب',
          message: `طلب السحب بمبلغ ${existing.amount} دج أصبح: ${statusLabels[status]}`,
          link: '/creator/payouts',
        },
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: patchSessionUser.id,
        action: 'UPDATE_PAYOUT',
        entity: 'Payout',
        entityId: id,
        newValues: { status, providerPayoutId, notes } as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({ success: true, data: payout })
  } catch (error) {
    console.error('[Admin Payout PATCH]', error)
    await raiseAlert('warning', 'فشل تحديث سحب', `payout=${alertId || '?'}: ${error instanceof Error ? error.message : 'unknown'}`, '/admin/payouts')
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}