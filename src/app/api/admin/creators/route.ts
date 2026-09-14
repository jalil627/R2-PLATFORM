import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'creators')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('q') || ''
    const verified = searchParams.get('verified') || ''

    const where: Prisma.CreatorProfileWhereInput = {}
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { user: { store: { name: { contains: search } } } },
      ]
    }
    if (verified === 'verified') where.isVerified = true
    if (verified === 'unverified') where.isVerified = false

    const [creators, total] = await Promise.all([
      prisma.creatorProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, isActive: true, isBanned: true, store: { select: { name: true, slug: true } } } },
          products: { select: { id: true } },
          payouts: { select: { id: true, amount: true, status: true, createdAt: true } },
        },
      }),
      prisma.creatorProfile.count({ where }),
    ])

    const data = creators.map(c => ({
      ...c,
      productCount: c.products.length,
      store: c.user.store || null,
    }))

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('[Admin Creators GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}