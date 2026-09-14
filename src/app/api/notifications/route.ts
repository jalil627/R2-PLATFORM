import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'

interface NotificationPatchBody {
  notificationIds?: unknown
  markAll?: unknown
}

export async function GET() {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const notifications = await prisma.notification.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ success: true, data: notifications })
  } catch {
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    const patchSessionUser = getSessionUser(session)
    if (!patchSessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { notificationIds, markAll } = await request.json() as NotificationPatchBody

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: patchSessionUser.id, isRead: false },
        data: { isRead: true },
      })
    } else if (Array.isArray(notificationIds) && notificationIds.length) {
      const ids = notificationIds.filter((id): id is string => typeof id === 'string')
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId: patchSessionUser.id },
        data: { isRead: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
