import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { slugify } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = sessionUser.id
    const raw = request.nextUrl.searchParams.get('slug') || ''
    const slug = slugify(raw)
    if (!slug) return NextResponse.json({ success: true, data: { available: false } })

    const mine = await prisma.store.findUnique({ where: { userId }, select: { slug: true } })
    const existing = await prisma.store.findFirst({ where: { slug, userId: { not: userId } } })
    return NextResponse.json({ success: true, data: { available: !existing || existing.slug === mine?.slug } })
  } catch (error) {
    console.error('[Store check]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}