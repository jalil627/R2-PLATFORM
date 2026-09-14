import prisma from '@/lib/db'
import { Prisma } from '@prisma/client'
import { calculatePlatformFee, calculateSellerEarnings, generateOrderNumber } from '@/lib/utils'

export interface PaymentResult {
  success: boolean
  transactionId?: string
  error?: string
}

export interface CreateOrderInput {
  buyerId: string
  sellerId: string
  productId: string
  amount: number
  currency?: string
  couponId?: string
  couponDiscount?: number
  paymentMethod: string
}

export async function createOrder(input: CreateOrderInput): Promise<{ orderId: string; orderNumber: string }> {
  const feePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10')
  const finalAmount = input.couponDiscount ? input.amount - input.couponDiscount : input.amount
  const platformFee = calculatePlatformFee(finalAmount, feePercent)
  const sellerEarnings = calculateSellerEarnings(finalAmount, platformFee, 0)

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      grossAmount: input.amount,
      platformFee,
      paymentFee: 0,
      sellerEarnings,
      currency: input.currency || 'DZD',
      couponId: input.couponId,
      status: 'PENDING',
      items: {
        create: {
          productId: input.productId,
          price: finalAmount,
          quantity: 1,
        },
      },
    },
  })

  return { orderId: order.id, orderNumber: order.orderNumber }
}

export async function settleOrder(orderId: string, transactionId?: string | null): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new Error('Order not found')

  const claim = await prisma.order.updateMany({
    where: { id: orderId, status: 'PENDING' },
    data: { status: 'PAID', transactionId: transactionId || null },
  })

  if (claim.count === 0) return

  await prisma.$transaction(async (tx) => {
    const orderItems = await tx.orderItem.findMany({ where: { orderId } })
    for (const item of orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { downloadCount: { increment: 1 } },
      })

      await tx.transaction.create({
        data: {
          type: 'SALE',
          userId: order.buyerId,
          orderId,
          amount: item.price,
          currency: order.currency,
        },
      })
    }

    await tx.transaction.create({
      data: {
        type: 'PLATFORM_FEE',
        orderId,
        amount: order.platformFee,
        currency: order.currency,
      },
    })

    await tx.creatorProfile.update({
      where: { id: order.sellerId },
      data: {
        pendingBalance: { increment: order.sellerEarnings },
        totalSales: { increment: 1 },
      },
    })

    await tx.notification.create({
      data: {
        userId: order.buyerId,
        type: 'PURCHASE_SUCCESS',
        title: 'تم تأكيد الشراء',
        message: `تم تأكيد طلبك رقم ${order.orderNumber} بنجاح`,
        link: '/dashboard/purchases',
      },
    })
  })
}

export async function processPayment(orderId: string, method: string, metadata?: Record<string, unknown>): Promise<PaymentResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return { success: false, error: 'Order not found' }

  const provider = process.env.PAYMENT_PROVIDER || 'manual'

  if (!provider || provider === 'none' || provider === 'manual') {
    // Auto-settling without a real transaction hands out paid products for free.
    // Only ever allow it for zero-cost orders, or outside production.
    if (order.grossAmount > 0 && process.env.NODE_ENV === 'production') {
      console.error(`[Payment] Refused manual settle of paid order ${orderId} — no payment provider configured`)
      return { success: false, error: 'Payment provider not configured' }
    }

    await prisma.payment.create({
      data: {
        orderId,
        amount: order.grossAmount,
        currency: order.currency,
        provider: 'manual',
        status: 'PAID',
        metadata: (metadata || {}) as unknown as Prisma.InputJsonValue,
        webhookVerified: true,
      },
    })

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentProvider: 'manual' },
    })

    const transactionId = `manual-${orderId}`
    await settleOrder(orderId, transactionId)

    return { success: true, transactionId }
  }

  return { success: false, error: 'Payment provider not configured' }
}

// NOTE: a generic, signature-less webhook handler used to live here. It trusted
// `payload.orderId`/`payload.status` and settled orders, which let anyone forge a
// "paid" event. Any new provider must verify its own signature (see chargily.ts)
// before calling settleOrder.

export async function processRefund(orderId: string, amount: number, reason?: string, processedBy?: string): Promise<PaymentResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return { success: false, error: 'Order not found' }
  if (order.status !== 'PAID') return { success: false, error: 'Order is not paid' }

  await prisma.$transaction(async (tx) => {
    await tx.refund.create({
      data: {
        orderId,
        amount,
        reason,
        status: 'PAID',
        processedBy,
      },
    })

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'REFUNDED' },
    })

    const feePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10')
    const platformFee = calculatePlatformFee(amount, feePercent)
    const sellerReduction = amount - platformFee

    await tx.creatorProfile.update({
      where: { id: order.sellerId },
      data: {
        pendingBalance: { decrement: sellerReduction },
        totalSales: { decrement: 1 },
      },
    })

    await tx.transaction.create({
      data: {
        type: 'REFUND',
        userId: order.buyerId,
        orderId,
        amount: -amount,
        currency: order.currency,
        description: reason,
      },
    })
  })

  return { success: true }
}

export async function requestPayout(creatorId: string, amount: number, method: string, details?: Record<string, unknown>): Promise<{ payoutId: string } | { error: string }> {
  const creator = await prisma.creatorProfile.findUnique({ where: { id: creatorId } })
  if (!creator) return { error: 'Creator not found' }
  if (creator.availableBalance < amount) return { error: 'Insufficient balance' }

  const payout = await prisma.$transaction(async (tx) => {
    const p = await tx.payout.create({
      data: {
        creatorId,
        amount,
        status: 'REQUESTED',
        provider: method,
        details: (details || {}) as unknown as Prisma.InputJsonValue,
      },
    })

    await tx.creatorProfile.update({
      where: { id: creatorId },
      data: { availableBalance: { decrement: amount } },
    })

    await tx.transaction.create({
      data: {
        type: 'PAYOUT',
        userId: creator.userId,
        amount: -amount,
        currency: 'DZD',
        description: `Payout request via ${method}`,
      },
    })

    return p
  })

  return { payoutId: payout.id }
}
