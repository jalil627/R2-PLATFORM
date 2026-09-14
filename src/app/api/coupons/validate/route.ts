import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const productId = searchParams.get('productId')

    if (!code) {
      return NextResponse.json({ success: false, error: 'الكود مطلوب' }, { status: 400 })
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: new Date() } },
        ],
        AND: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ],
        },
      },
    })

    if (!coupon) {
      return NextResponse.json({ success: false, error: 'كود غير صالح' }, { status: 404 })
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json({ success: false, error: 'الكود منتهي الاستخدام' }, { status: 400 })
    }

    if (coupon.appliesTo === 'specific' && coupon.productId && coupon.productId !== productId) {
      return NextResponse.json({ success: false, error: 'الكود لا ينطبق على هذا المنتج' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId || '' } })
    if (product && coupon.minOrderAmount && product.price < coupon.minOrderAmount) {
      return NextResponse.json({ success: false, error: `الحد الأدنى للطلب ${coupon.minOrderAmount} دج` }, { status: 400 })
    }

    const discount = product
      ? coupon.discountType === 'percentage'
        ? product.price * (coupon.discountValue / 100)
        : Math.min(coupon.discountValue, product.price)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount: Math.round(discount),
      },
    })
  } catch (error) {
    console.error('[Coupon Validate]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
