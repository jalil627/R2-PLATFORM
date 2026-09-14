import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'
import { rateLimit, rateLimitKey } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'messages')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rate = rateLimit(rateLimitKey('broadcast', request), { windowMs: 60_000, max: 10 })
    if (!rate.ok) {
      return NextResponse.json({ success: false, error: 'طلبات كثيرة جدًا، حاول لاحقًا' }, { status: 429 })
    }

    const body = await request.json()
    const message = String(body.message || '').trim()
    const title = String(body.title || 'رسالة من الإدارة').trim()
    const link = String(body.link || '').trim()

    if (!message) {
      return NextResponse.json({ success: false, error: 'نص الرسالة مطلوب' }, { status: 400 })
    }

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    })

    if (users.length === 0) {
      return NextResponse.json({ success: true, data: { sent: 0 } })
    }

    const { count } = await prisma.notification.createMany({
      data: users.map(u => ({
        userId: u.id,
        type: 'SYSTEM',
        title,
        message,
        link: link || null,
      })),
    })

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: 'BROADCAST',
        entity: 'Notification',
        entityId: 'all',
        newValues: { sent: count, title, message },
      },
    })

    return NextResponse.json({ success: true, data: { sent: count }, message: `تم إرسال الرسالة إلى ${count} مستخدم` })
  } catch (error) {
    console.error('[Admin Broadcast POST]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}