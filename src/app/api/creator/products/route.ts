import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { slugify } from '@/lib/utils'
import { rateLimit, rateLimitKey } from '@/lib/rate-limit'
import { ProductCreateInputSchema } from '@/lib/validation'
import { getPublicImageUrl } from '@/lib/storage'
import { getPlatformSettings, hasActivePro } from '@/lib/plans'

export async function GET() {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = sessionUser.id
    const creator = await prisma.creatorProfile.findUnique({ where: { userId } })
    if (!creator) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const products = await prisma.product.findMany({
      where: { creatorId: creator.id },
      orderBy: { createdAt: 'desc' },
      include: {
        files: true,
        images: { take: 1 },
        _count: { select: { reviews: true, orderItems: true, downloads: true } },
      },
    })

    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    console.error('[Creator Products GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const rate = rateLimit(rateLimitKey('create-product', request), { windowMs: 60_000, max: 30 })
    if (!rate.ok) {
      return NextResponse.json({ success: false, error: 'طلبات كثيرة جدًا، حاول لاحقًا' }, { status: 429 })
    }

    const session = await auth()
    const postSessionUser = getSessionUser(session)
    if (!postSessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = postSessionUser.id
    const creator = await prisma.creatorProfile.findUnique({ where: { userId } })
    if (!creator) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()

    if (!hasActivePro(creator.plan, creator.planExpiresAt)) {
      const settings = await getPlatformSettings()
      const maxFree = Number(settings.free_max_products || 5)
      const count = await prisma.product.count({ where: { creatorId: creator.id } })
      if (count >= maxFree) {
        return NextResponse.json({
          success: false,
          error: `الخطة المجانية تسمح بحد أقصى ${maxFree} منتجات. رقِّ إلى خطة برو لإضافة منتجات غير محدودة.`,
        }, { status: 403 })
      }
    }

    const parsed = ProductCreateInputSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message || 'بيانات غير صالحة'
      return NextResponse.json({ success: false, error: first }, { status: 400 })
    }

    const {
      title, description, shortDescription, type, price, compareAtPrice,
      isFree, isPayWhatYouWant, minPrice, license, requirements,
      seoTitle, seoDescription, seoKeywords,
      categoryIds, tagIds, status, files, images,
    } = parsed.data

    let slug = slugify(title) || `product-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    const existing = await prisma.product.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

    const store = await prisma.store.findUnique({ where: { userId } })

    const wantsPublish = status === 'published'
    const publishStatus = wantsPublish ? 'PENDING_REVIEW' : 'DRAFT'

    const imageRows = (images ?? []).map((img, i) => ({
      url: img.url.startsWith('local://') ? getPublicImageUrl(img.url.slice(8)) : img.url,
      alt: img.name || img.alt || title,
      position: i,
    }))

    const product = await prisma.product.create({
      data: {
        creatorId: creator.id,
        storeId: store?.id || null,
        title,
        slug,
        description,
        shortDescription,
        type,
        price: price || 0,
        compareAtPrice,
        isFree: isFree || price === 0,
        isPayWhatYouWant,
        minPrice,
        license,
        requirements,
        seoTitle,
        seoDescription,
        seoKeywords,
        status: publishStatus,
        publishedAt: wantsPublish ? new Date() : null,
        thumbnail: imageRows[0]?.url || null,
        categories: categoryIds?.length ? {
          create: categoryIds.map((id: string) => ({ categoryId: id })),
        } : undefined,
        tags: tagIds?.length ? {
          create: tagIds.map((id: string) => ({ tagId: id })),
        } : undefined,
        images: imageRows.length ? { create: imageRows } : undefined,
        files: files?.length ? {
          create: files.map((f) => ({
            name: f.name,
            url: f.url,
            size: f.size || 0,
            mimeType: f.mimeType || null,
          })),
        } : undefined,
      },
    })

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error('[Creator Products POST]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
