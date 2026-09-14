import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'

export async function GET() {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const wishlist = await prisma.wishlist.findMany({
      where: { userId: sessionUser.id },
      include: {
        product: {
          include: {
            creator: { include: { user: { select: { name: true, avatar: true } } } },
            images: { take: 1 },
            _count: { select: { reviews: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: wishlist.map(w => w.product) })
  } catch {
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const postSessionUser = getSessionUser(session)
    if (!postSessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { productId } = await request.json() as { productId?: unknown }
    if (typeof productId !== 'string' || !productId) return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 })

    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: postSessionUser.id, productId } },
    })

    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } })
      return NextResponse.json({ success: true, data: { action: 'removed' } })
    }

    await prisma.wishlist.create({
      data: { userId: postSessionUser.id, productId },
    })

    return NextResponse.json({ success: true, data: { action: 'added' } })
  } catch {
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
