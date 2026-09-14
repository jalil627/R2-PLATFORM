import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { slugify, safeExternalUrl } from '@/lib/utils'

const LINK_KEYS = ['website', 'twitter', 'instagram', 'facebook', 'youtube', 'linkedin', 'tiktok'] as const

/** Keeps only known link keys holding real http(s) URLs — everything else is dropped. */
function sanitizeLinks(input: unknown): Record<string, string> | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined
  const source = input as Record<string, unknown>
  const clean: Record<string, string> = {}
  for (const key of LINK_KEYS) {
    const url = safeExternalUrl(source[key])
    if (url) clean[key] = url
  }
  return clean
}

export async function GET() {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = sessionUser.id
    const [store, user] = await Promise.all([
      prisma.store.findUnique({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, avatar: true } }),
    ])

    return NextResponse.json({ success: true, data: { store, user } })
  } catch (error) {
    console.error('[Store GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    const putSessionUser = getSessionUser(session)
    if (!putSessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = putSessionUser.id
    const { name, slug, bio, links, logo } = await request.json()

    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2 || name.length > 100)) {
      return NextResponse.json({ success: false, error: 'اسم المتجر يجب أن يكون بين 2 و 100 حرف' }, { status: 400 })
    }
    if (bio !== undefined && bio !== null && (typeof bio !== 'string' || bio.length > 1000)) {
      return NextResponse.json({ success: false, error: 'النبذة تتجاوز 1000 حرف' }, { status: 400 })
    }
    if (logo !== undefined && logo !== null && (typeof logo !== 'string' || logo.length > 2048)) {
      return NextResponse.json({ success: false, error: 'رابط الشعار غير صالح' }, { status: 400 })
    }

    const safeLinks = sanitizeLinks(links)

    let finalSlug = slug
    if (slug) {
      finalSlug = slugify(slug)
      const existing = await prisma.store.findFirst({ where: { slug: finalSlug, userId: { not: userId } } })
      if (existing) return NextResponse.json({ success: false, error: 'الرابط مستخدم' }, { status: 409 })
    }

    const store = await prisma.store.upsert({
      where: { userId },
      update: { name, slug: finalSlug, bio, links: safeLinks, ...(logo !== undefined && { logo }) },
      create: { userId, name, slug: finalSlug || userId, bio, links: safeLinks, ...(logo !== undefined && { logo }) },
    })

    return NextResponse.json({ success: true, data: store })
  } catch (error) {
    console.error('[Store PUT]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}