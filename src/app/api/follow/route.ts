import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { creatorId } = await request.json() as { creatorId?: unknown }
    const creator = await prisma.creatorProfile.findUnique({ where: { id: typeof creatorId === 'string' ? creatorId : '' } })
    if (!creator) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const userId = sessionUser.id
    if (userId === creator.userId) {
      return NextResponse.json({ success: false, error: 'لا يمكنك متابعة نفسك' }, { status: 400 })
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: creator.userId } },
    })

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } })
      return NextResponse.json({ success: true, data: { action: 'unfollowed' } })
    }

    await prisma.follow.create({
      data: { followerId: userId, followingId: creator.userId },
    })

    await prisma.notification.create({
      data: {
        userId: creator.userId,
        type: 'NEW_FOLLOWER',
        title: 'متابع جديد!',
        message: `${sessionUser.name || 'مستخدم'} تابع متجرك`,
      },
    })

    return NextResponse.json({ success: true, data: { action: 'followed' } })
  } catch {
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
