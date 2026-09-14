import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'
import { parsePagination } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'alerts')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const { page, pageSize, skip } = parsePagination(searchParams, { defaultPageSize: 20, maxPageSize: 100 })
    const severity = searchParams.get('severity') || ''
    const unread = searchParams.get('unread') === '1'

    const where: Prisma.SystemAlertWhereInput = {}
    if (['info', 'warning', 'critical'].includes(severity)) where.severity = severity
    if (unread) where.isRead = false

    const [alerts, total, unreadCount] = await Promise.all([
      prisma.systemAlert.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
      prisma.systemAlert.count({ where }),
      prisma.systemAlert.count({ where: { isRead: false } }),
    ])

    return NextResponse.json({
      success: true,
      data: { alerts, total, page, pageSize, totalPages: Math.ceil(total / pageSize), unreadCount },
    })
  } catch (error) {
    console.error('[Admin Alerts GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'alerts')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    if (body?.all) {
      await prisma.systemAlert.updateMany({ where: { isRead: false }, data: { isRead: true } })
    } else if (typeof body?.id === 'string') {
      await prisma.systemAlert.updateMany({ where: { id: body.id }, data: { isRead: true } })
    } else {
      return NextResponse.json({ success: false, error: 'بيانات غير صالحة' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Alerts PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
