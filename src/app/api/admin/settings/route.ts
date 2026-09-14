import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getPlatformSettings } from '@/lib/plans'
import { getSessionUser } from '@/lib/auth/permissions'

function canEditSettings(role?: string) {
  return role === 'SUPER_ADMIN'
}

const EDITABLE_KEYS = [
  'platform_name',
  'platform_url',
  'default_currency',
  'platform_fee_percent',
  'maintenance_mode',
  'plan_first_price',
  'plan_renew_price',
  'plan_days',
  'plan_first_days',
  'free_max_products',
  'plan_discount_percent',
  'plan_discount_scope',
  'plan_discount_starts_at',
  'plan_discount_ends_at',
  'bank_account_ccp',
  'bank_account_name',
  'payout_min_amount',
  'payout_hold_days',
]

export async function GET() {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canEditSettings(sessionUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const settings = await getPlatformSettings()
    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('[Admin Settings GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    const putSessionUser = getSessionUser(session)
    if (!putSessionUser || !canEditSettings(putSessionUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const allowedNames = new Set(EDITABLE_KEYS)

    for (const [key, raw] of Object.entries(body)) {
      if (!allowedNames.has(key)) continue

      let value: Prisma.InputJsonValue = raw as Prisma.InputJsonValue
      if (typeof raw === 'string') {
        const trimmed = raw.trim()
        if (trimmed === '') continue
        if (key === 'maintenance_mode') value = trimmed === 'true' || trimmed === 'on' || trimmed === '1'
        else if (['platform_fee_percent', 'plan_first_price', 'plan_renew_price', 'plan_days', 'plan_first_days', 'free_max_products', 'plan_discount_percent', 'payout_min_amount', 'payout_hold_days'].includes(key)) {
          const num = parseFloat(trimmed)
          if (isNaN(num)) continue
          value = num
        } else if (key === 'plan_discount_scope') {
          value = ['ALL', 'FIRST', 'RENEW'].includes(trimmed.toUpperCase()) ? trimmed.toUpperCase() : 'ALL'
        } else value = trimmed
      }

      await prisma.platformSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: putSessionUser.id,
        action: 'UPDATE_PLATFORM_SETTINGS',
        entity: 'PlatformSetting',
        entityId: 'all',
        newValues: body,
      },
    })

    revalidateTag('platform-settings', 'max')

    const settings = await getPlatformSettings()
    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('[Admin Settings PUT]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}