import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = sessionUser.id
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'buyer'

    const where = role === 'seller'
      ? { seller: { userId } }
      : { buyerId: userId }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { name: true, email: true, avatar: true } },
        seller: { include: { user: { select: { name: true } } } },
        items: { include: { product: { select: { title: true, thumbnail: true } } } },
        payment: true,
        coupon: true,
      },
    })

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error('[Orders GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
