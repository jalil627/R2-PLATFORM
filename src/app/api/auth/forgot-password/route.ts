import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/db'
import { sendEmail, getPasswordResetEmail } from '@/lib/email'
import { rateLimit, rateLimitKey } from '@/lib/rate-limit'

// One reply for every outcome, so the response can't reveal whether an
// address is registered.
const GENERIC_RESPONSE = { success: true, message: 'إذا كان البريد مسجلًا، ستصلك رسالة إعادة التعيين' }

export async function POST(request: NextRequest) {
  try {
    // Throttled per IP: unlimited requests would let an attacker mail-bomb a
    // victim and burn the Resend quota.
    const rate = rateLimit(rateLimitKey('forgot-password', request), { windowMs: 15 * 60_000, max: 5 })
    if (!rate.ok) {
      return NextResponse.json({ success: false, error: 'طلبات كثيرة جدًا، حاول لاحقًا' }, { status: 429 })
    }

    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'البريد الإلكتروني مطلوب' }, { status: 400 })
    }

    const normalized = email.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: normalized }, select: { id: true, email: true, name: true, isActive: true, isBanned: true } })
    if (!user || user.isBanned || !user.isActive) {
      return NextResponse.json(GENERIC_RESPONSE)
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({ data: { userId: user.id, token, expires } }),
    ])

    const baseUrl = process.env.PLATFORM_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`
    const { subject, html } = getPasswordResetEmail(user.name || user.email, resetUrl)
    await sendEmail({ to: user.email, subject, html })

    return NextResponse.json(GENERIC_RESPONSE)
  } catch (error) {
    console.error('[Forgot Password]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
