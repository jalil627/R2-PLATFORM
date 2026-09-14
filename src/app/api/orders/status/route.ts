import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { handleCheckoutReturn } from '@/lib/payment/chargily'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = sessionUser.id
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('order')

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: 'Order number is required' }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: { orderNumber, buyerId: userId },
      select: { orderNumber: true, status: true },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const result = await handleCheckoutReturn(order)

    return NextResponse.json({ success: true, data: { orderNumber, status: result.status } })
  } catch (error) {
    console.error('[Order status GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}