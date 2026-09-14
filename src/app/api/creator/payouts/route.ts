import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { rateLimit, rateLimitKey } from '@/lib/rate-limit'
import { requestPayout } from '@/lib/payment'
import { raiseAlert } from '@/lib/alerts'
import {
  loadPayoutConfig,
  releaseMaturedBalances,
  validatePayoutAccount,
  PAYOUT_METHOD_LABELS,
  type PayoutMethod,
} from '@/lib/payouts'

async function requireCreator(userId: string) {
  const creator = await prisma.creatorProfile.findUnique({ where: { userId } })
  return creator
}

export async function GET() {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const creator = await requireCreator(sessionUser.id)
    if (!creator) {
      return NextResponse.json({ success: true, data: [] })
    }
    const payouts = await prisma.payout.findMany({
      where: { creatorId: creator.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const config = await loadPayoutConfig()
    return NextResponse.json({
      success: true,
      data: {
        payouts,
        balances: { pending: creator.pendingBalance, available: creator.availableBalance },
        config,
      },
    })
  } catch (error) {
    console.error('[Creator Payouts GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = rateLimit(rateLimitKey('payout-request', request), { windowMs: 60 * 60_000, max: 5 })
    if (!limit.ok) {
      return NextResponse.json({ success: false, error: 'طلبات كثيرة جدًا، حاول لاحقًا' }, { status: 429 })
    }

    const creator = await requireCreator(sessionUser.id)
    if (!creator) {
      return NextResponse.json({ success: false, error: 'حساب المبدع غير موجود' }, { status: 404 })
    }

    const body = await request.json()
    const amount = Number(body?.amount)
    const method = String(body?.method || '')
    const holderName = String(body?.holderName || '')
    const account = String(body?.account || '')
    const key = body?.key !== undefined ? String(body.key) : undefined

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'المبلغ غير صالح' }, { status: 400 })
    }

    const accountError = validatePayoutAccount({ method, holderName, account, key })
    if (accountError) {
      return NextResponse.json({ success: false, error: accountError }, { status: 400 })
    }

    // Unlock matured earnings before checking the balance.
    await releaseMaturedBalances(creator.id)
    const fresh = await prisma.creatorProfile.findUnique({ where: { id: creator.id } })
    if (!fresh) {
      return NextResponse.json({ success: false, error: 'حساب المبدع غير موجود' }, { status: 404 })
    }

    const config = await loadPayoutConfig()
    if (amount < config.minAmount) {
      return NextResponse.json({ success: false, error: `الحد الأدنى للسحب ${config.minAmount} دج` }, { status: 400 })
    }
    if (amount > fresh.availableBalance) {
      return NextResponse.json({ success: false, error: 'المبلغ يتجاوز رصيدك المتاح' }, { status: 400 })
    }

    const existing = await prisma.payout.findFirst({
      where: { creatorId: creator.id, status: { in: ['REQUESTED', 'PENDING', 'PROCESSING'] } },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ success: false, error: 'لديك طلب سحب قيد المعالجة — انتظر إتمامه قبل طلب جديد' }, { status: 409 })
    }

    const digits = account.replace(/[\s-]/g, '')
    const result = await requestPayout(creator.id, amount, PAYOUT_METHOD_LABELS[method as PayoutMethod], {
      method,
      holderName: holderName.trim(),
      account: digits,
      ...(key ? { key: key.trim() } : {}),
    })
    if ('error' in result) {
      return NextResponse.json({ success: false, error: 'تعذر إنشاء الطلب، حاول لاحقًا' }, { status: 400 })
    }

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: 'PAYOUT_REQUEST',
        entity: 'Payout',
        entityId: result.payoutId,
        newValues: { amount, method } as unknown as Prisma.InputJsonValue,
      },
    })

    const payout = await prisma.payout.findUnique({ where: { id: result.payoutId } })
    return NextResponse.json({ success: true, data: payout })
  } catch (error) {
    console.error('[Creator Payouts POST]', error)
    await raiseAlert('warning', 'فشل طلب سحب', error instanceof Error ? error.message : 'unknown', '/admin/payouts')
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
