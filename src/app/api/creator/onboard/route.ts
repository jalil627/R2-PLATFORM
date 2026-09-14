import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { slugify } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = sessionUser.id
    const { storeName, storeSlug } = await request.json()

    const existingCreator = await prisma.creatorProfile.findUnique({ where: { userId } })

    const slugBase = storeSlug || slugify(storeName || `creator-${userId}`)
    let finalSlug = slugBase
    let counter = 1
    while (await prisma.store.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slugBase}-${counter++}`
    }

    const result = await prisma.$transaction(async (tx) => {
      const creator = existingCreator || await tx.creatorProfile.create({
        data: {
          userId,
        },
      })

      const store = await tx.store.upsert({
        where: { userId },
        update: { name: storeName || `متجر ${sessionUser.name || ''}`, slug: finalSlug },
        create: { userId, name: storeName || `متجر ${sessionUser.name || ''}`, slug: finalSlug },
      })

      await tx.user.update({ where: { id: userId }, data: { role: 'CREATOR' } })

      return { creator, store }
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[Creator Onboard]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}