import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { getPlatformSettings, getPromoPlanPrices, planPriceForUser, planDurationForUser } from '@/lib/plans'

export async function GET() {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = sessionUser.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, memberNo: true, creatorProfile: { select: { plan: true, planExpiresAt: true } } },
    })

    const settings = await getPlatformSettings()
    const purchases = await prisma.planPurchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    const hasPurchasedBefore = purchases.some(p => p.status === 'PAID')

    const profile = user?.creatorProfile
    const planActive = profile?.plan === 'PRO' && (!profile.planExpiresAt || profile.planExpiresAt.getTime() > Date.now())
    const daysLeft = profile?.planExpiresAt
      ? Math.max(0, Math.ceil((profile.planExpiresAt.getTime() - Date.now()) / 86400000))
      : (planActive ? -1 : 0)

    const promo = getPromoPlanPrices(settings, hasPurchasedBefore)

    return NextResponse.json({
      success: true,
      data: {
        plan: planActive ? 'PRO' : 'FREE',
        isPro: planActive,
        planExpiresAt: profile?.planExpiresAt || null,
        daysLeft,
        firstPrice: promo.first.price,
        renewPrice: promo.renew.price,
        firstOriginalPrice: promo.first.original,
        renewOriginalPrice: promo.renew.original,
        firstDiscount: promo.first.discount,
        renewDiscount: promo.renew.discount,
        promoActive: promo.active,
        promoPercent: promo.percent,
        promoScope: promo.scope,
        promoStartsAt: promo.startsAt,
        promoEndsAt: promo.endsAt,
        months: 1,
        hasPurchasedBefore,
        freeMaxProducts: Number(settings.free_max_products || 5),
        purchases: purchases.map(p => ({
          id: p.id,
          plan: p.plan,
          amount: p.amount,
          status: p.status,
          reference: p.reference,
          paymentMethod: p.paymentMethod,
          adminNote: p.adminNote,
          createdAt: p.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('[Creator Plans GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const postSessionUser = getSessionUser(session)
    if (!postSessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = postSessionUser.id

    let body: Record<string, unknown> = {}
    try { body = await request.json() as Record<string, unknown> } catch {}

    const plan = String(body.plan || 'PRO').toUpperCase()
    if (plan !== 'PRO') {
      return NextResponse.json({ success: false, error: 'خطة غير مدعومة' }, { status: 400 })
    }

    const reference = String(body.reference || '').trim()
    const paymentMethod = String(body.paymentMethod || 'BANK_TRANSFER').trim()

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { creatorProfile: { select: { plan: true, planExpiresAt: true } } },
    })
    if (!user) return NextResponse.json({ success: false, error: 'حساب غير موجود' }, { status: 404 })

    const settings = await getPlatformSettings()
    const purchases = await prisma.planPurchase.findMany({ where: { userId, status: 'PAID' }, take: 1 })
    const hasPurchasedBefore = purchases.length > 0

    const amount = planPriceForUser(settings, hasPurchasedBefore)
    const days = planDurationForUser(settings, hasPurchasedBefore)

    const purchase = await prisma.planPurchase.create({
      data: {
        userId,
        plan,
        amount,
        months: 1,
        paymentMethod,
        reference: reference || null,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل طلب الاشتراك بنجاح. سيتم تفعيل الخطة بعد تأكيد الدفعة.',
      data: {
        purchaseId: purchase.id,
        amount,
        days,
        hasPurchasedBefore,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[Creator Plans POST]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}