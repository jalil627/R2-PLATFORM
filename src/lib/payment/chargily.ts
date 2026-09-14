import { createHmac, timingSafeEqual } from 'crypto'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'
import { settleOrder } from './index'

const API_BASE =
  process.env.CHARGILY_API_BASE ||
  (process.env.CHARGILY_ENV === 'live'
    ? 'https://pay.chargily.net/api/v2'
    : 'https://pay.chargily.net/test/api/v2')

export function isChargilyConfigured(): boolean {
  return process.env.PAYMENT_PROVIDER === 'chargily' && !!process.env.CHARGILY_SECRET_KEY
}

export interface ChargilyCheckout {
  id: string
  amount: number
  currency: string
  status: string
  checkout_url: string
  metadata?: Record<string, unknown> | null
  [key: string]: unknown
}

function chargilySecret(): string {
  const secret = process.env.CHARGILY_SECRET_KEY
  if (!secret) throw new Error('CHARGILY_SECRET_KEY is not configured')
  return secret
}

function amountToChargily(amountDZD: number): number {
  const scale = parseFloat(process.env.CHARGILY_AMOUNT_SCALE || '100')
  return Math.round(amountDZD * scale)
}

export async function createChargilyCheckout(opts: {
  orderId: string
  orderNumber: string
  amountDZD: number
  title: string
}): Promise<{ checkoutId: string; checkoutUrl: string }> {
  const platform = process.env.PLATFORM_URL || 'http://localhost:3000'

  const res = await fetch(`${API_BASE}/checkouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${chargilySecret()}`,
    },
    body: JSON.stringify({
      amount: amountToChargily(opts.amountDZD),
      currency: 'dzd',
      payment_method: process.env.CHARGILY_PAYMENT_METHOD || 'edahabia',
      success_url: `${platform}/checkout/success?order=${opts.orderNumber}`,
      failure_url: `${platform}/checkout/success?order=${opts.orderNumber}&failed=1`,
      webhook_endpoint: `${platform}/api/webhooks/payment`,
      description: `${opts.title} — الطلب ${opts.orderNumber}`,
      locale: 'ar',
      metadata: { orderId: opts.orderId, orderNumber: opts.orderNumber },
    }),
  })

  const data = (await res.json().catch(() => null)) as ChargilyCheckout | null

  if (!res.ok || !data?.id || !data.checkout_url) {
    const errPayload = data as unknown as { message?: unknown; error?: unknown } | null
    const nestedMessage = errPayload?.error && typeof errPayload.error === 'object' && 'message' in errPayload.error
      ? (errPayload.error as { message?: unknown }).message
      : undefined
    const message =
      (typeof errPayload?.message === 'string' ? errPayload.message : undefined) ||
      (typeof nestedMessage === 'string' ? nestedMessage : undefined) ||
      (typeof errPayload?.error === 'string' ? errPayload.error : undefined) ||
      `تعذر إنشاء معاملة الدفع (${res.status})`
    throw new Error(String(message))
  }

  return { checkoutId: data.id, checkoutUrl: data.checkout_url }
}

export async function getChargilyCheckout(checkoutId: string): Promise<ChargilyCheckout> {
  const res = await fetch(`${API_BASE}/checkouts/${checkoutId}`, {
    headers: { Authorization: `Bearer ${chargilySecret()}` },
  })
  const data = (await res.json().catch(() => null)) as ChargilyCheckout | null
  if (!res.ok || !data?.id) throw new Error(`تعذر التحقق من الدفع (${res.status})`)
  return data
}

export function verifyChargilySignature(rawBody: string, signature: string | null): boolean {
  try {
    const secret = chargilySecret()
    if (!signature) return false
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function handleChargilyEvent(event: Record<string, unknown>): Promise<boolean> {
  if (event.entity !== 'event' || !event.type) return false

  const checkout = (event.data && typeof event.data === 'object' ? event.data : {}) as ChargilyCheckout

  let order =
    checkout.metadata?.orderId && typeof checkout.metadata.orderId === 'string'
      ? await prisma.order.findUnique({ where: { id: checkout.metadata.orderId } })
      : null

  if (!order && checkout.id) {
    const payment = await prisma.payment.findFirst({ where: { providerPaymentId: checkout.id } })
    order = payment ? await prisma.order.findUnique({ where: { id: payment.orderId } }) : null
  }

  if (!order) return false

  if (event.type === 'checkout.paid') {
    if (order.status === 'PAID') return true

    await prisma.payment.updateMany({
      where: { orderId: order.id },
      data: {
        status: 'PAID',
        providerPaymentId: checkout.id,
        webhookVerified: true,
        metadata: event as unknown as Prisma.InputJsonValue,
      },
    })

    await settleOrder(order.id, checkout.id)

    return true
  }

  if (event.type === 'checkout.failed' || event.type === 'checkout.canceled') {
    if (order.status === 'PAID') return true

    const isFailed = event.type === 'checkout.failed'

    await prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { orderId: order.id },
        data: { status: isFailed ? 'FAILED' : 'CANCELLED', webhookVerified: true },
      })
      await tx.order.update({
        where: { id: order.id },
        data: { status: isFailed ? 'FAILED' : 'CANCELLED' },
      })
    })

    return true
  }

  return false
}

export async function handleCheckoutReturn(order: { orderNumber: string }): Promise<{ status: string }> {
  const orderRow = await prisma.order.findUnique({
    where: { orderNumber: order.orderNumber },
    select: { id: true, status: true, paymentProvider: true, transactionId: true },
  })
  if (!orderRow) throw new Error('Order not found')

  if (orderRow.status === 'PENDING' && orderRow.paymentProvider === 'chargily' && orderRow.transactionId) {
    try {
      const checkout = await getChargilyCheckout(orderRow.transactionId)
      if (checkout.status === 'paid' && orderRow.status === 'PENDING') {
        await handleChargilyEvent({ entity: 'event', type: 'checkout.paid', data: checkout })
        return { status: 'PAID' }
      }
      if ((checkout.status === 'failed' || checkout.status === 'canceled') && orderRow.status === 'PENDING') {
        await handleChargilyEvent({ entity: 'event', type: `checkout.${checkout.status}`, data: checkout })
        return { status: checkout.status === 'failed' ? 'FAILED' : 'CANCELLED' }
      }
    } catch {
      // leave the order pending; the webhook is the source of truth
    }
  }

  return { status: orderRow.status }
}