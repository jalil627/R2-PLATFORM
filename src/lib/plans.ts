import prisma from '@/lib/db'
import { getCachedPlatformSettings } from '@/lib/home-data'
import { Prisma } from '@prisma/client'

export type PlatformSettingsMap = Record<string, Prisma.JsonValue>

export const PLAN_NAMES: Record<string, string> = {
  FREE: 'مجاني',
  PRO: 'برو',
}

export const PLAN_DEFAULT_SETTINGS = {
  plan_first_price: 300,
  plan_renew_price: 1000,
  plan_days: 30,
  plan_first_days: 30,
  free_max_products: 5,
  platform_fee_percent: 10,
  maintenance_mode: false,
  plan_discount_percent: 0,
  plan_discount_scope: 'ALL',
  plan_discount_starts_at: '',
  plan_discount_ends_at: '',
}

export async function getPlatformSettings(): Promise<PlatformSettingsMap> {
  const rows = await getCachedPlatformSettings()
  const map: PlatformSettingsMap = { ...PLAN_DEFAULT_SETTINGS }
  for (const r of rows) {
    map[r.key] = r.value as Prisma.JsonValue
  }
  return map
}

export function hasActivePro(plan: string | null | undefined, planExpiresAt: Date | null | undefined): boolean {
  if (plan !== 'PRO') return false
  if (!planExpiresAt) return true
  return planExpiresAt.getTime() > Date.now()
}

export function getCreatorPlanStatus(creator: { plan?: string | null; planExpiresAt?: Date | null } | null | undefined) {
  if (!creator) return { plan: 'FREE', isPro: false, daysLeft: 0, active: false }
  const isPro = hasActivePro(creator.plan, creator.planExpiresAt)
  const daysLeft = creator.planExpiresAt
    ? Math.max(0, Math.ceil((creator.planExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : (isPro ? -1 : 0)
  return {
    plan: isPro ? 'PRO' : 'FREE',
    isPro,
    daysLeft,
    expiresAt: creator.planExpiresAt,
    active: isPro,
  }
}

export async function ensureCreatorProfile(userId: string) {
  const existing = await prisma.creatorProfile.findUnique({ where: { userId } })
  if (existing) return existing
  const settings = await getPlatformSettings()
  return prisma.creatorProfile.create({
    data: { userId, commissionRate: parseFloat(process.env.PLATFORM_FEE_PERCENT || String(settings.platform_fee_percent || 10)) },
  })
}

function promoActive(settings: PlatformSettingsMap): number {
  const percent = Math.max(0, Math.min(95, Math.round(Number(settings.plan_discount_percent) || 0)))
  if (!percent) return 0
  // Admins pick plain calendar dates, so compare YYYY-MM-DD strings directly.
  // Mixing a local-midnight Date with UTC-parsed bounds shifted the window by a
  // day; ISO date strings sort lexicographically, so this stays timezone-safe.
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const starts = settings.plan_discount_starts_at ? String(settings.plan_discount_starts_at).slice(0, 10) : null
  const ends = settings.plan_discount_ends_at ? String(settings.plan_discount_ends_at).slice(0, 10) : null
  if (starts && today < starts) return 0
  if (ends && today > ends) return 0 // end date is inclusive
  return percent
}

export function getPromoPlanPrices(settings: PlatformSettingsMap, hasPurchasedBefore?: boolean) {
  const firstBase = Math.max(0, Number(settings.plan_first_price) || PLAN_DEFAULT_SETTINGS.plan_first_price)
  const renewBase = Math.max(0, Number(settings.plan_renew_price) || PLAN_DEFAULT_SETTINGS.plan_renew_price)
  const percent = promoActive(settings)
  const scope = String(settings.plan_discount_scope || 'ALL').toUpperCase()

  const apply = (base: number): { price: number; original: number; discount: number } =>
    percent
      ? { price: Math.round(base * (100 - percent)) / 100, original: base, discount: percent }
      : { price: base, original: base, discount: 0 }

  const firstApplies = percent && (scope === 'ALL' || scope === 'FIRST')
  const renewApplies = percent && (scope === 'ALL' || scope === 'RENEW')

  const first = firstApplies ? apply(firstBase) : { price: firstBase, original: firstBase, discount: 0 }
  const renew = renewApplies ? apply(renewBase) : { price: renewBase, original: renewBase, discount: 0 }

  return {
    active: percent > 0,
    percent,
    scope,
    startsAt: settings.plan_discount_starts_at || null,
    endsAt: settings.plan_discount_ends_at || null,
    first,
    renew,
    hasPurchasedBefore: !!hasPurchasedBefore,
  }
}

export function planPriceForUser(settings: PlatformSettingsMap, hasPurchasedBefore: boolean): number {
  const promo = getPromoPlanPrices(settings, hasPurchasedBefore)
  return hasPurchasedBefore ? promo.renew.price : promo.first.price
}

export function planDurationForUser(settings: PlatformSettingsMap, hasPurchasedBefore: boolean): number {
  const first = Number(settings.plan_first_days || PLAN_DEFAULT_SETTINGS.plan_first_days)
  const renew = Number(settings.plan_days || PLAN_DEFAULT_SETTINGS.plan_days)
  return hasPurchasedBefore ? renew : first
}