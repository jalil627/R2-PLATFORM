import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'
import { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES } from '@/lib/complaints'

interface ComplaintPatchBody {
  status?: unknown
  priority?: unknown
  adminNote?: unknown
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'complaints')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.complaint.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'الشكوى غير موجودة' }, { status: 404 })
    }

    let body: ComplaintPatchBody = {}
    try { body = await request.json() as ComplaintPatchBody } catch {}

    const status = body.status !== undefined ? String(body.status).trim() : undefined
    const priority = body.priority !== undefined ? String(body.priority).trim() : undefined
    const adminNote = body.adminNote !== undefined ? String(body.adminNote).trim() : undefined

    if (status !== undefined && !COMPLAINT_STATUSES.some(s => s.value === status)) {
      return NextResponse.json({ success: false, error: 'حالة غير صالحة' }, { status: 400 })
    }
    if (priority !== undefined && !COMPLAINT_PRIORITIES.some(p => p.value === priority)) {
      return NextResponse.json({ success: false, error: 'أولوية غير صالحة' }, { status: 400 })
    }
    if (adminNote !== undefined && adminNote.length > 2000) {
      return NextResponse.json({ success: false, error: 'الملاحظة طويلة جدًا' }, { status: 400 })
    }

    const data: Prisma.ComplaintUpdateInput = {}
    if (status !== undefined) data.status = status
    if (priority !== undefined) data.priority = priority
    if (adminNote !== undefined) data.adminNote = adminNote || null

    const complaint = await prisma.complaint.update({ where: { id }, data })

    return NextResponse.json({ success: true, data: complaint })
  } catch (error) {
    console.error('[Admin Complaints PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}