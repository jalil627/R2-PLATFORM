import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'reviews')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('q') || ''
    const rating = searchParams.get('rating') || ''
    const hidden = searchParams.get('hidden') || ''

    const where: Prisma.ReviewWhereInput = {}
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { product: { title: { contains: search } } },
        { text: { contains: search } },
      ]
    }
    if (rating) where.rating = parseInt(rating)
    if (hidden === 'hidden') where.isHidden = true
    if (hidden === 'visible') where.isHidden = false

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          product: { select: { id: true, title: true, thumbnail: true, slug: true } },
        },
      }),
      prisma.review.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: reviews,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('[Admin Reviews GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}