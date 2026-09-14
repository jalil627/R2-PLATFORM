import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { ProductCreateInputSchema } from '@/lib/validation'
import { getPublicImageUrl } from '@/lib/storage'
import { rateLimit, rateLimitKey } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const userId = sessionUser.id
    const creator = await prisma.creatorProfile.findUnique({ where: { userId } })
    if (!creator) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        categories: true,
        tags: true,
        files: true,
        images: { orderBy: { position: 'asc' } },
      },
    })
    if (!product || product.creatorId !== creator.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        categoryIds: product.categories.map(c => c.categoryId),
        tagIds: product.tags.map(t => t.tagId),
      },
    })
  } catch (error) {
    console.error('[Creator Product GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rate = rateLimit(rateLimitKey('delete-product', request), { windowMs: 60_000, max: 20 })
    if (!rate.ok) {
      return NextResponse.json({ success: false, error: 'طلبات كثيرة جدًا، حاول لاحقًا' }, { status: 429 })
    }

    const session = await auth()
    const deleteSessionUser = getSessionUser(session)
    if (!deleteSessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const userId = deleteSessionUser.id
    const creator = await prisma.creatorProfile.findUnique({ where: { userId } })
    if (!creator) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const product = await prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    })
    if (!product || product.creatorId !== creator.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (product._count.orderItems > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف منتج له طلبات. يمكنك إلغاء نشره بدلاً من ذلك.' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.productFile.deleteMany({ where: { productId: id } })
      await tx.productImage.deleteMany({ where: { productId: id } })
      await tx.affiliateLink.deleteMany({ where: { productId: id } })
      await tx.download.deleteMany({ where: { productId: id } })
      await tx.wishlist.deleteMany({ where: { productId: id } })
      await tx.review.deleteMany({ where: { productId: id } })
      await tx.coupon.deleteMany({ where: { productId: id } })
      await tx.product.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Creator Product DELETE]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rate = rateLimit(rateLimitKey('edit-product', request), { windowMs: 60_000, max: 30 })
    if (!rate.ok) {
      return NextResponse.json({ success: false, error: 'طلبات كثيرة جدًا، حاول لاحقًا' }, { status: 429 })
    }

    const session = await auth()
    const patchSessionUser = getSessionUser(session)
    if (!patchSessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const userId = patchSessionUser.id
    const creator = await prisma.creatorProfile.findUnique({ where: { userId } })
    if (!creator) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const product = await prisma.product.findUnique({
      where: { id },
      include: { categories: true, tags: true },
    })
    if (!product || product.creatorId !== creator.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = ProductCreateInputSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message || 'بيانات غير صالحة'
      return NextResponse.json({ success: false, error: first }, { status: 400 })
    }

    const {
      title, description, shortDescription, type, price, compareAtPrice,
      isFree, license, categoryIds, status, files, images,
    } = parsed.data

    const wantsPublish = status === 'published' || status === 'pending'
    const currentStatus = product.status

    if (currentStatus === 'SUSPENDED' && wantsPublish) {
      return NextResponse.json(
        { success: false, error: 'منتجك معلّق من الإدارة ولا يمكن نشره الآن' },
        { status: 403 }
      )
    }

    let newStatus = currentStatus
    if (currentStatus === 'APPROVED' || currentStatus === 'PENDING_REVIEW') {
      newStatus = wantsPublish ? 'APPROVED' : 'DRAFT'
    } else {
      newStatus = wantsPublish ? 'APPROVED' : 'DRAFT'
    }

    let publishedAt = product.publishedAt
    if (newStatus === 'DRAFT') {
      publishedAt = null
    } else if (!publishedAt) {
      publishedAt = new Date()
    }

    const categoryIdsList = categoryIds ?? (product.categories.map(c => c.categoryId) as string[])
    const imageRows = images === undefined ? undefined : images.map((img, i) => ({
      url: img.url.startsWith('local://') ? getPublicImageUrl(img.url.slice(8)) : img.url,
      alt: img.name || img.alt || title,
      position: i,
    }))

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id: product.id },
        data: {
          title,
          description,
          shortDescription,
          type,
          price: price || 0,
          compareAtPrice,
          isFree: isFree || price === 0,
          license,
          status: newStatus,
          publishedAt,
          thumbnail: imageRows?.[0]?.url ?? product.thumbnail,
          categories: {
            deleteMany: {},
            create: categoryIdsList.map((cid: string) => ({ categoryId: cid })),
          },
        },
      })

      if (files !== undefined) {
        await tx.productFile.deleteMany({ where: { productId: product.id } })
        if (files.length) {
          await tx.productFile.createMany({
            data: files.map((f) => ({
              productId: product.id,
              name: f.name,
              url: f.url,
              size: f.size || 0,
              mimeType: f.mimeType || null,
            })),
          })
        }
      }

      if (imageRows !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: product.id } })
        if (imageRows.length) {
          await tx.productImage.createMany({
            data: imageRows.map((r) => ({ ...r, productId: product.id })),
          })
        }
      }

      return p
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[Creator Product PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}