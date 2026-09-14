import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'complaints')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))
    const status = searchParams.get('status') || ''
    const q = searchParams.get('q') || ''

    const where: Prisma.ComplaintWhereInput = {}
    if (status) where.status = status
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q.toLowerCase() } },
        { subject: { contains: q } },
        { id: { contains: q } },
      ]
    }

    const [complaints, total, pendingCount] = await Promise.all([
      prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      }),
      prisma.complaint.count({ where }),
      prisma.complaint.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    ])

    return NextResponse.json({
      success: true,
      data: complaints,
      total,
      page,
      pageSize,
      pendingCount,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('[Admin Complaints GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}