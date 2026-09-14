import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'categories')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true } },
        parent: { select: { id: true, name: true, nameAr: true } },
        children: { select: { id: true, name: true, nameAr: true, slug: true, isActive: true } },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error('[Admin Category GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const patchSessionUser = getSessionUser(session)
    if (!patchSessionUser || !canAccessSection(patchSessionUser.role, 'categories')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, nameAr, slug, icon, parentId, sortOrder, isActive } = body

    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.category.findUnique({ where: { slug } })
      if (slugExists) {
        return NextResponse.json({ error: 'الرمز (slug) مستخدم مسبقًا' }, { status: 400 })
      }
    }

    if (parentId) {
      if (parentId === id) {
        return NextResponse.json({ error: 'لا يمكن أن يكون التصنيف أبًا لنفسه' }, { status: 400 })
      }
      const parent = await prisma.category.findUnique({ where: { id: parentId } })
      if (!parent) {
        return NextResponse.json({ error: 'التصنيف الأب غير موجود' }, { status: 400 })
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(nameAr && { nameAr }),
        ...(slug && { slug }),
        ...(icon !== undefined && { icon }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error('[Admin Category PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const deleteSessionUser = getSessionUser(session)
    if (!deleteSessionUser || !canAccessSection(deleteSessionUser.role, 'categories')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    const childrenCount = await prisma.category.count({ where: { parentId: id } })
    const productsCount = await prisma.productCategory.count({ where: { categoryId: id } })

    if (childrenCount > 0 || productsCount > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف التصنيف لوجود تصنيفات فرعية أو منتجات مرتبطة' },
        { status: 400 }
      )
    }

    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Category DELETE]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}