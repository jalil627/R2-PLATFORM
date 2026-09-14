import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { createOrder, processPayment } from '@/lib/payment'
import { createChargilyCheckout, isChargilyConfigured } from '@/lib/payment/chargily'
import { rateLimit, rateLimitKey } from '@/lib/rate-limit'
import { checkoutApiSchema } from '@/lib/validation'
import { raiseAlert } from '@/lib/alerts'

export async function POST(request: NextRequest) {
  let alertOrder = ''
  let alertUser = ''
  try {
    const rate = rateLimit(rateLimitKey('checkout', request), { windowMs: 60_000, max: 20 })
    if (!rate.ok) {
      return NextResponse.json({ success: false, error: 'طلبات كثيرة جدًا، حاول لاحقًا' }, { status: 429 })
    }

    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = sessionUser.id
    alertUser = userId
    const body = await request.json()

    const parsed = checkoutApiSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'بيانات غير صالحة' }, { status: 400 })
    }

    const { productId, couponCode, paymentMethod } = parsed.data

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { creator: true },
    })

    if (!product || product.status !== 'APPROVED') {
      return NextResponse.json({ success: false, error: 'المنتج غير موجود' }, { status: 404 })
    }

    if (product.creator.userId === userId) {
      return NextResponse.json({ success: false, error: 'لا يمكنك شراء منتجك الخاص' }, { status: 400 })
    }

    const existingOrder = await prisma.order.findFirst({
      where: {
        buyerId: userId,
        items: { some: { productId } },
        status: 'PAID',
      },
    })

    if (existingOrder) {
      return NextResponse.json({ success: false, error: 'لقد اشتريت هذا المنتج بالفعل' }, { status: 400 })
    }

    let couponId: string | undefined
    let couponDiscount = 0

    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          AND: [
            { OR: [
              { scope: 'PLATFORM', OR: [{ productId: null }, { productId }] },
              { scope: 'CREATOR', creatorId: product.creatorId },
            ] },
            { OR: [
              { startsAt: null },
              { startsAt: { lte: new Date() } },
            ] },
            { OR: [
              { expiresAt: null },
              { expiresAt: { gte: new Date() } },
            ] },
          ],
        },
      })

      if (coupon && (!coupon.maxUses || coupon.currentUses < coupon.maxUses)) {
        if (coupon.appliesTo === 'all' || coupon.productId === productId) {
          couponId = coupon.id
          couponDiscount = coupon.discountType === 'percentage'
            ? product.price * (coupon.discountValue / 100)
            : Math.min(coupon.discountValue, product.price)
        }
      }
    }

    const { orderId, orderNumber } = await createOrder({
      buyerId: userId,
      sellerId: product.creatorId,
      productId,
      amount: product.price,
      couponId,
      couponDiscount,
      paymentMethod: paymentMethod || 'manual',
    })
    alertOrder = orderId

    const finalAmount = couponDiscount ? product.price - couponDiscount : product.price

    if (isChargilyConfigured() && product.price > 0 && !product.isFree) {
      await prisma.payment.create({
        data: {
          orderId,
          amount: finalAmount,
          currency: 'DZD',
          provider: 'chargily',
          status: 'PENDING',
          metadata: { paymentMethod: process.env.CHARGILY_PAYMENT_METHOD || 'edahabia' },
        },
      })

      await prisma.order.update({
        where: { id: orderId },
        data: { paymentProvider: 'chargily' },
      })

      try {
        const checkout = await createChargilyCheckout({
          orderId,
          orderNumber,
          amountDZD: finalAmount,
          title: product.title,
        })

        await prisma.payment.updateMany({
          where: { orderId },
          data: { providerPaymentId: checkout.checkoutId },
        })
        await prisma.order.update({
          where: { id: orderId },
          data: { transactionId: checkout.checkoutId },
        })

        if (couponId) {
          await prisma.coupon.update({ where: { id: couponId }, data: { currentUses: { increment: 1 } } })
          await prisma.couponUsage.create({ data: { couponId, userId, orderId } })
        }

        return NextResponse.json({
          success: true,
          data: {
            orderId,
            orderNumber,
            redirectUrl: checkout.checkoutUrl,
          },
        })
      } catch (error: unknown) {
        await prisma.order.update({ where: { id: orderId }, data: { status: 'FAILED' } })
        const message = error instanceof Error ? error.message : 'تعذر إنشاء معاملة الدفع'
        return NextResponse.json(
          { success: false, error: message },
          { status: 400 },
        )
      }
    }

    if (couponId) {
      await prisma.coupon.update({
        where: { id: couponId },
        data: { currentUses: { increment: 1 } },
      })
      await prisma.couponUsage.create({
        data: { couponId, userId, orderId },
      })
    }

    const paymentResult = await processPayment(orderId, paymentMethod || 'manual', { orderId })

    if (paymentResult.success) {
      return NextResponse.json({
        success: true,
        data: {
          orderId,
          orderNumber,
          transactionId: paymentResult.transactionId,
        },
      })
    }

    return NextResponse.json({ success: false, error: paymentResult.error || 'فشل الدفع' }, { status: 400 })
  } catch (error) {
    console.error('[Checkout POST]', error)
    await raiseAlert('critical', 'فشل في إتمام طلب', `order=${alertOrder || '?'} user=${alertUser || '?'}: ${error instanceof Error ? error.message : 'unknown'}`.slice(0, 500), '/admin/orders')
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
