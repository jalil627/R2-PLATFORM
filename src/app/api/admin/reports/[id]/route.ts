import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

const validStatuses = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'reports')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, resolution } = body

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 })
    }

    const existing = await prisma.report.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    const updateData: Prisma.ReportUpdateInput = {
      moderator: { connect: { id: sessionUser.id } },
    }
    if (status) updateData.status = status
    if (resolution !== undefined) updateData.resolution = resolution

    const report = await prisma.report.update({
      where: { id },
      data: updateData,
      include: {
        reporter: { select: { name: true, email: true } },
        moderator: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    console.error('[Admin Report PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}