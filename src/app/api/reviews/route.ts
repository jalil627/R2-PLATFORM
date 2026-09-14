import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { rateLimit, rateLimitKey } from '@/lib/rate-limit'

const MAX_TITLE = 120
const MAX_TEXT = 2000

async function recomputeStats(productId: string) {
  const stats = await prisma.review.aggregate({
    where: { productId, isHidden: false },
    _avg: { rating: true },
    _count: { rating: true },
  })
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: Math.round((stats._avg.rating || 0) * 10) / 10,
      reviewCount: stats._count.rating,
    },
  })
}

function parseRating(input: unknown): number | null {
  const n = Math.round(Number(input))
  if (!Number.isInteger(n) || n < 1 || n > 10) return null
  return n
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 })
    }

    const reviews = await prisma.review.findMany({
      where: { productId, isHidden: false },
      include: { user: { select: { name: true, avatar: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: reviews })
  } catch (error) {
    console.error('[Reviews GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

async function getVerifiedPurchase(userId: string, productId: string) {
  return prisma.orderItem.findFirst({
    where: { productId, order: { buyerId: userId, status: 'PAID' } },
  })
}

export async function POST(request: NextRequest) {
  try {
    const rate = rateLimit(rateLimitKey('reviews', request), { windowMs: 60_000, max: 30 })
    if (!rate.ok) {
      return NextResponse.json({ success: false, error: 'طلبات كثيرة جدًا، حاول لاحقًا' }, { status: 429 })
    }

    const session = await auth()
    const reviewerSessionUser = getSessionUser(session)
    if (!reviewerSessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = reviewerSessionUser.id
    const { productId, rating, title, text } = await request.json()

    if (!productId) {
      return NextResponse.json({ success: false, error: 'معرّف المنتج مطلوب' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { creator: { select: { userId: true } } },
    })
    if (!product) {
      return NextResponse.json({ success: false, error: 'المنتج غير موجود' }, { status: 404 })
    }
    if (product.creator.userId === userId) {
      return NextResponse.json({ success: false, error: 'لا يمكنك تقييم منتجك الخاص' }, { status: 400 })
    }

    const r = parseRating(rating)
    if (r === null) {
      return NextResponse.json({ success: false, error: 'التقييم يجب أن يكون رقمًا من 1 إلى 10' }, { status: 400 })
    }

    const cleanTitle = typeof title === 'string' ? title.trim().slice(0, MAX_TITLE) : ''
    const cleanText = typeof text === 'string' ? text.trim().slice(0, MAX_TEXT) : ''
    if (!cleanTitle && !cleanText) {
      return NextResponse.json({ success: false, error: 'أضف تعليقًا أو عنوانًا لتقييمك' }, { status: 400 })
    }

    const verified = await getVerifiedPurchase(userId, productId)
    if (!verified) {
      return NextResponse.json(
        { success: false, error: 'اشترِ هذا المنتج أولًا لتتمكن من تقييمه' },
        { status: 403 },
      )
    }

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    })

    const review = existing
      ? await prisma.review.update({
          where: { id: existing.id },
          data: { rating: r, title: cleanTitle || null, text: cleanText || null },
        })
      : await prisma.review.create({
          data: {
            productId,
            userId,
            rating: r,
            title: cleanTitle || null,
            text: cleanText || null,
            isVerifiedPurchase: true,
          },
        })

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: product.creator.userId,
          type: 'NEW_REVIEW',
          title: 'تقييم جديد على منتجك',
          message: `قيّم ${reviewerSessionUser.name || 'مشتري'} منتجك بـ ${r}/10`,
          link: `/product/${product.slug}`,
        },
      })
    }

    await recomputeStats(productId)

    const withUser = await prisma.review.findUnique({
      where: { id: review.id },
      include: { user: { select: { name: true, avatar: true, username: true } } },
    })

    return NextResponse.json({ success: true, data: withUser })
  } catch (error) {
    console.error('[Reviews POST]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rate = rateLimit(rateLimitKey('reviews', request), { windowMs: 60_000, max: 30 })
    if (!rate.ok) {
      return NextResponse.json({ success: false, error: 'طلبات كثيرة جدًا، حاول لاحقًا' }, { status: 429 })
    }

    const session = await auth()
    const reviewerSessionUser = getSessionUser(session)
    if (!reviewerSessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = reviewerSessionUser.id
    const { productId, rating, title, text } = await request.json()

    if (!productId) {
      return NextResponse.json({ success: false, error: 'معرّف المنتج مطلوب' }, { status: 400 })
    }

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'لم تقيّم هذا المنتج بعد' }, { status: 404 })
    }

    const data: { rating?: number; title?: string | null; text?: string | null } = {}

    if (rating !== undefined) {
      const r = parseRating(rating)
      if (r === null) {
        return NextResponse.json({ success: false, error: 'التقييم يجب أن يكون رقمًا من 1 إلى 10' }, { status: 400 })
      }
      data.rating = r
    }

    if (title !== undefined) data.title = typeof title === 'string' ? title.trim().slice(0, MAX_TITLE) : null
    if (text !== undefined) data.text = typeof text === 'string' ? text.trim().slice(0, MAX_TEXT) : null

    const review = await prisma.review.update({ where: { id: existing.id }, data })
    await recomputeStats(productId)

    const withUser = await prisma.review.findUnique({
      where: { id: review.id },
      include: { user: { select: { name: true, avatar: true, username: true } } },
    })

    return NextResponse.json({ success: true, data: withUser })
  } catch (error) {
    console.error('[Reviews PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    const deleteReviewer = getSessionUser(session)
    if (!deleteReviewer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = deleteReviewer.id
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ success: false, error: 'معرّف المنتج مطلوب' }, { status: 400 })
    }

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'لم تقيّم هذا المنتج بعد' }, { status: 404 })
    }

    await prisma.review.delete({ where: { id: existing.id } })
    await recomputeStats(productId)

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('[Reviews DELETE]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}