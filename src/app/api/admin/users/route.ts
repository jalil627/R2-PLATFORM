import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'
import { like } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'users')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const role = searchParams.get('role') || ''
    const search = searchParams.get('q') || ''

    const where: Prisma.UserWhereInput = {}
    if (role) where.role = role as Prisma.UserWhereInput['role']
    if (search) {
      where.OR = [
        { name: like(search) },
        { email: like(search) },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true, avatar: true, memberNo: true,
          isActive: true, isBanned: true, createdAt: true, lastLoginAt: true,
          creatorProfile: { select: { isVerified: true, totalEarnings: true, totalSales: true, plan: true, planExpiresAt: true } },
          _count: { select: { orders: true } },
        },
        orderBy: [{ memberNo: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('[Admin Users]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
