import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const userId = sessionUser.id
    const { slug } = await params

    const product = await prisma.product.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      select: { id: true, creator: { select: { userId: true, id: true } } },
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'المنتج غير موجود' }, { status: 404 })
    }

    const isOwner = product.creator.userId === userId
    const [paidOrderItem, myReview, wish, follow] = await Promise.all([
      prisma.orderItem.findFirst({
        where: { productId: product.id, order: { buyerId: userId, status: 'PAID' } },
        select: { id: true },
      }),
      prisma.review.findUnique({
        where: { productId_userId: { productId: product.id, userId } },
      }),
      prisma.wishlist.findUnique({
        where: { userId_productId: { userId, productId: product.id } },
      }),
      isOwner
        ? Promise.resolve(null)
        : prisma.follow.findUnique({
            where: {
              followerId_followingId: { followerId: userId, followingId: product.creator.userId },
            },
          }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        owned: !!paidOrderItem,
        isOwner,
        productOwnerId: product.creator.userId,
        creatorProfileId: product.creator.id,
        myReview,
        inWishlist: !!wish,
        following: !!follow,
      },
    })
  } catch (error) {
    console.error('[Product state GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}