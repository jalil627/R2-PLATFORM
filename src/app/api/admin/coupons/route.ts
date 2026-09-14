import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'coupons')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('q') || ''
    const creatorFilter = searchParams.get('creator') || ''
    const scopeFilter = searchParams.get('scope') || ''

    const where: Prisma.CouponWhereInput = {}
    if (search) {
      where.code = { contains: search }
    }
    if (creatorFilter) {
      where.creatorId = creatorFilter
    }
    if (scopeFilter) {
      where.scope = scopeFilter
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          creator: { include: { user: { select: { id: true, name: true, email: true } } } },
          product: { select: { id: true, title: true } },
          _count: { select: { usages: true } },
        },
      }),
      prisma.coupon.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: coupons,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('[Admin Coupons GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const postSessionUser = getSessionUser(session)
    if (!postSessionUser || !canAccessSection(postSessionUser.role, 'coupons')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const code = String(body.code || '').toUpperCase().trim()
    const discountType = body.discountType === 'fixed' ? 'fixed' : 'percentage'
    const discountValue = parseFloat(body.discountValue)
    const productId = body.productId || null
    const startsAt = body.startsAt ? new Date(body.startsAt) : null
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null

    if (!code || isNaN(discountValue) || discountValue <= 0) {
      return NextResponse.json({ success: false, error: 'الكود وقيمة الخصم مطلوبان' }, { status: 400 })
    }
    if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      return NextResponse.json({ success: false, error: 'نسبة الخصم بين 1 و 100' }, { status: 400 })
    }

    const existing = await prisma.coupon.findFirst({
      where: { code, scope: 'PLATFORM' },
    })
    if (existing) {
      return NextResponse.json({ success: false, error: 'هذا الكود مستخدم مسبقًا' }, { status: 400 })
    }

    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId } })
      if (!product) {
        return NextResponse.json({ success: false, error: 'المنتج غير موجود' }, { status: 400 })
      }
    }

    const coupon = await prisma.coupon.create({
      data: {
        scope: 'PLATFORM',
        creatorId: null,
        code,
        discountType,
        discountValue,
        minOrderAmount: body.minOrderAmount ? Number(body.minOrderAmount) : null,
        maxUses: body.maxUses ? Number(body.maxUses) : null,
        appliesTo: productId ? 'specific' : 'all',
        productId,
        startsAt,
        expiresAt,
        isActive: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: postSessionUser.id,
        action: 'CREATE_PLATFORM_COUPON',
        entity: 'Coupon',
        entityId: coupon.id,
        newValues: { code, discountType, discountValue, productId },
      },
    })

    return NextResponse.json({ success: true, data: coupon }, { status: 201 })
  } catch (error) {
    console.error('[Admin Coupons POST]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}