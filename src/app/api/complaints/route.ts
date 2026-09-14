import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { COMPLAINT_TYPES } from '@/lib/complaints'

interface ComplaintBody {
  name?: unknown
  email?: unknown
  type?: unknown
  subject?: unknown
  message?: unknown
}

export async function POST(request: NextRequest) {
  try {
    let body: ComplaintBody = {}
    try { body = await request.json() as ComplaintBody } catch {}

    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const type = String(body.type || 'general').trim()
    const subject = String(body.subject || '').trim()
    const message = String(body.message || '').trim()

    if (name.length < 2) {
      return NextResponse.json({ success: false, error: 'يرجى إدخال اسمك' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'يرجى إدخال بريد إلكتروني صحيح' }, { status: 400 })
    }
    if (!COMPLAINT_TYPES.some(t => t.value === type)) {
      return NextResponse.json({ success: false, error: 'نوع الشكوى غير صالح' }, { status: 400 })
    }
    if (subject.length < 3) {
      return NextResponse.json({ success: false, error: 'الموضوع قصير جدًا (3 أحرف على الأقل)' }, { status: 400 })
    }
    if (message.length < 10) {
      return NextResponse.json({ success: false, error: 'تفاصيل الشكوى قصيرة جدًا (10 أحرف على الأقل)' }, { status: 400 })
    }

    const session = await auth()
    const userId = getSessionUser(session)?.id || null

    const complaint = await prisma.complaint.create({
      data: { name, email, type, subject, message, userId },
      select: { id: true, createdAt: true, status: true },
    })

    return NextResponse.json({
      success: true,
      message: 'تم استلام شكواك بنجاح',
      data: { ...complaint, ref: complaint.id.slice(-8).toUpperCase() },
    }, { status: 201 })
  } catch (error) {
    console.error('[Complaints POST]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما، حاول مرة أخرى' }, { status: 500 })
  }
}