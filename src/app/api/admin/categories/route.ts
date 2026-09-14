import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'categories')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('q') || ''
    const sort = searchParams.get('sort') || 'sortOrder'

    const where: Prisma.CategoryWhereInput = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameAr: { contains: search } },
        { slug: { contains: search } },
      ]
    }

    const orderBy: Prisma.CategoryOrderByWithRelationInput = (() => {
      switch (sort) {
        case 'name': return { name: 'asc' }
        case 'nameAr': return { nameAr: 'asc' }
        case 'createdAt': return { createdAt: 'desc' }
        case 'sortOrder':
        default: return { sortOrder: 'asc' }
      }
    })()

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { products: true, children: true } },
          parent: { select: { id: true, name: true, nameAr: true } },
        },
      }),
      prisma.category.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: categories,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('[Admin Categories GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const postSessionUser = getSessionUser(session)
    if (!postSessionUser || !canAccessSection(postSessionUser.role, 'categories')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, nameAr, slug, icon, parentId, sortOrder, isActive } = body

    if (!name || !nameAr || !slug) {
      return NextResponse.json({ error: 'الحقول المطلوبة: name, nameAr, slug' }, { status: 400 })
    }

    const existing = await prisma.category.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'الرمز (slug) مستخدم مسبقًا' }, { status: 400 })
    }

    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } })
      if (!parent) {
        return NextResponse.json({ error: 'التصنيف الأب غير موجود' }, { status: 400 })
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        nameAr,
        slug,
        icon,
        parentId,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
      },
    })

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error('[Admin Categories POST]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}