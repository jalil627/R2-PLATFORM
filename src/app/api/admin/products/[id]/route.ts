import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'products')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, isFeatured } = body

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(status !== undefined && { status, publishedAt: status === 'APPROVED' ? new Date() : undefined }),
        ...(isFeatured !== undefined && { isFeatured }),
      },
      select: { id: true, title: true, status: true, isFeatured: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: 'UPDATE_PRODUCT',
        entity: 'Product',
        entityId: id,
        newValues: body,
      },
    })

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error('[Admin Product PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}