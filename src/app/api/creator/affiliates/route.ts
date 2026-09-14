import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { ensureCreatorProfile, hasActivePro } from '@/lib/plans'

export async function GET() {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = sessionUser.id

    const links = await prisma.affiliateLink.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, title: true, slug: true, type: true, isFree: true } },
        _count: { select: { clicks: true, conversions: true } },
      },
    })

    return NextResponse.json({ success: true, data: links.map(l => ({ ...l, clicks: l._count.clicks, conversions: l._count.conversions })) })
  } catch (error) {
    console.error('[Creator Affiliates GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const postSessionUser = getSessionUser(session)
    if (!postSessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = postSessionUser.id

    const creator = await ensureCreatorProfile(userId)
    if (!hasActivePro(creator.plan, creator.planExpiresAt)) {
      return NextResponse.json({
        success: false,
        error: 'روابط الدعوة والتسويق بالعمولة متاحة فقط في خطة برو. رقِّ إلى برو من صفحة الخطة.',
      }, { status: 403 })
    }

    const body = await request.json()
    const productId = String(body.productId || '')
    if (!productId) {
      return NextResponse.json({ success: false, error: 'المنتج مطلوب' }, { status: 400 })
    }

    const product = await prisma.product.findFirst({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ success: false, error: 'المنتج غير موجود' }, { status: 404 })
    }

    const existing = await prisma.affiliateLink.findFirst({ where: { userId, productId } })
    if (existing) {
      return NextResponse.json({ success: true, data: existing, exists: true })
    }

    const code = `${userId.slice(0, 6)}${productId.slice(0, 6)}`.toLowerCase()
    const link = await prisma.affiliateLink.create({
      data: { userId, productId, code, commissionRate: Number(body.commissionRate || 10) },
    })

    return NextResponse.json({ success: true, data: link, exists: false }, { status: 201 })
  } catch (error) {
    console.error('[Creator Affiliates POST]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}