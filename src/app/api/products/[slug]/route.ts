import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const ref = request.nextUrl.searchParams.get('ref')

    const matched = await prisma.product.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      select: { id: true, status: true },
    })

    if (!matched || matched.status !== 'APPROVED') {
      return NextResponse.json({ success: false, error: 'المنتج غير موجود' }, { status: 404 })
    }

    if (ref) {
      const affiliate = await prisma.affiliateLink.findFirst({
        where: { code: ref, productId: matched.id, isActive: true },
        select: { id: true },
      })
      if (affiliate) {
        await prisma.$transaction([
          prisma.affiliateClick.create({
            data: {
              affiliateLinkId: affiliate.id,
              ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
              userAgent: request.headers.get('user-agent')?.slice(0, 500) || null,
              referrer: request.headers.get('referer')?.slice(0, 500) || null,
            },
          }),
          prisma.affiliateLink.update({ where: { id: affiliate.id }, data: { clickCount: { increment: 1 } } }),
        ])
      }
    }

    const product = await prisma.product.update({
      where: { id: matched.id },
      data: { viewCount: { increment: 1 } },
      include: {
        creator: { select: { isVerified: true, user: { select: { name: true, avatar: true, username: true } } } },
        store: { select: { name: true, slug: true, logo: true } },
        files: { select: { id: true, name: true, size: true, mimeType: true } },
        images: { orderBy: { position: 'asc' } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        versions: { orderBy: { createdAt: 'desc' } },
        reviews: {
          where: { isHidden: false },
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { reviews: true, orderItems: true, downloads: true } },
      },
    })

    const [breakdownRows, saleCount] = await Promise.all([
      prisma.review.groupBy({
        by: ['rating'],
        where: { productId: product.id, isHidden: false },
        _count: { rating: true },
      }),
      prisma.orderItem.count({
        where: { productId: product.id, order: { status: 'PAID' } },
      }),
    ])

    const ratingBreakdown = Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => ({
      rating: n,
      count: breakdownRows.find((row) => row.rating === n)?._count.rating ?? 0,
    }))

    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        status: 'APPROVED',
        categories: { some: { categoryId: { in: product.categories.map(c => c.categoryId) } } },
      },
      take: 4,
      include: {
        creator: { include: { user: { select: { name: true, avatar: true } } } },
        images: { take: 1 },
        _count: { select: { reviews: true } },
      },
    })

    return NextResponse.json({ success: true, data: { ...product, relatedProducts, saleCount, ratingBreakdown } })
  } catch (error) {
    console.error('[Product GET]', error)
    return NextResponse.json({ success: false, error: 'المنتج غير موجود' }, { status: 404 })
  }
}
