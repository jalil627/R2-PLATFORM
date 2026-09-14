import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'reviews')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { isHidden } = body

    if (isHidden === undefined) {
      return NextResponse.json({ error: 'الحقل مطلوب: isHidden' }, { status: 400 })
    }

    const existing = await prisma.review.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    const review = await prisma.review.update({
      where: { id },
      data: { isHidden },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { title: true } },
      },
    })

    return NextResponse.json({ success: true, data: review })
  } catch (error) {
    console.error('[Admin Review PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}