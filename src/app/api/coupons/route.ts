import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { hasActivePro } from '@/lib/plans'

export async function GET() {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = sessionUser.id
    const creator = await prisma.creatorProfile.findUnique({ where: { userId } })
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const coupons = await prisma.coupon.findMany({
      where: { creatorId: creator.id },
      include: { product: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: coupons })
  } catch (error) {
    console.error('[Coupons GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const postSessionUser = getSessionUser(session)
    if (!postSessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = postSessionUser.id
    const creator = await prisma.creatorProfile.findUnique({ where: { userId } })
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    if (!hasActivePro(creator.plan, creator.planExpiresAt)) {
      return NextResponse.json({
        success: false,
        error: 'إنشاء الكوبونات متاح فقط في خطة برو. رقِّ إلى برو من صفحة الخطة.',
      }, { status: 403 })
    }

    const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt, productId } = await request.json()

    if (!code || !discountValue) {
      return NextResponse.json({ success: false, error: 'الكود وقيمة الخصم مطلوبان' }, { status: 400 })
    }

    const existing = await prisma.coupon.findFirst({
      where: { creatorId: creator.id, code: code.toUpperCase() },
    })
    if (existing) {
      return NextResponse.json({ success: false, error: 'كود الكوبون مستخدم مسبقًا' }, { status: 400 })
    }

    if (productId) {
      const product = await prisma.product.findFirst({ where: { id: productId, creatorId: creator.id } })
      if (!product) {
        return NextResponse.json({ success: false, error: 'المنتج غير موجود' }, { status: 400 })
      }
    }

    const coupon = await prisma.coupon.create({
      data: {
        creatorId: creator.id,
        code: code.toUpperCase().trim(),
        discountType: discountType === 'fixed' ? 'fixed' : 'percentage',
        discountValue: Number(discountValue),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
        maxUses: maxUses ? Number(maxUses) : null,
        appliesTo: productId ? 'specific' : 'all',
        productId: productId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, data: coupon }, { status: 201 })
  } catch (error) {
    console.error('[Coupons POST]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}