import { NextRequest, NextResponse } from 'next/server'
import { handleChargilyEvent, isChargilyConfigured, verifyChargilySignature } from '@/lib/payment/chargily'
import { raiseAlert } from '@/lib/alerts'

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text()

    // Fail closed: an unsigned webhook must never move money or grant entitlements.
    // Without a configured provider there is no secret to verify against, so reject.
    if (!isChargilyConfigured()) {
      console.error('[Webhook] Rejected: no verifiable payment provider configured')
      return NextResponse.json({ error: 'Webhooks are not enabled' }, { status: 503 })
    }

    const signature = request.headers.get('signature')
    if (!verifyChargilySignature(raw, signature)) {
      await raiseAlert('warning', 'توقيع webhook مرفوض', 'طلب webhook بتوقيع غير صالح — محاولة عبث محتملة.', '/admin/alerts')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const event = raw ? JSON.parse(raw) : {}
    const handled = await handleChargilyEvent(event)

    return NextResponse.json({ received: true, handled })
  } catch (error) {
    console.error('[Webhook]', error)
    await raiseAlert('critical', 'فشل معالج webhook للدفع', error instanceof Error ? error.message : 'unknown', '/admin/orders')
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}