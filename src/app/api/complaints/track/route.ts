import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { COMPLAINT_STATUSES } from '@/lib/complaints'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ref = String(searchParams.get('ref') || '').trim().toUpperCase()
    const email = String(searchParams.get('email') || '').trim().toLowerCase()

    if (!ref || !email) {
      return NextResponse.json({ success: false, error: 'أدخل رقم الشكوى والبريد الإلكتروني' }, { status: 400 })
    }

    const complaint = await prisma.complaint.findFirst({
      where: {
        email,
        OR: [
          { id: ref },
          { id: { endsWith: ref } },
        ],
      },
      select: { id: true, type: true, subject: true, status: true, priority: true, adminNote: true, createdAt: true, updatedAt: true },
    })

    if (!complaint) {
      return NextResponse.json({ success: false, error: 'لم نعثر على شكوى بهذه البيانات. تأكد من رقم الشكوى والبريد الإلكتروني.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { ...complaint, ref: complaint.id.slice(-8).toUpperCase() },
      statuses: COMPLAINT_STATUSES,
    })
  } catch (error) {
    console.error('[Complaints Track GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}