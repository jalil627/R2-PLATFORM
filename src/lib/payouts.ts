import prisma from '@/lib/db'

// Minimal settings view — kept local so this module stays importable in
// unit tests ( `@/lib/plans` pulls server-only dependencies).
export type SettingsMap = Record<string, unknown>

export const PAYOUT_METHODS = ['ccp', 'rip', 'baridimob'] as const
export type PayoutMethod = (typeof PAYOUT_METHODS)[number]

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  ccp: 'CCP / بريدي جاري',
  rip: 'تحويل بنكي (RIP)',
  baridimob: 'بريدي موب (BaridiMob)',
}

export interface PayoutConfig {
  minAmount: number
  holdDays: number
}

export function getPayoutConfig(settings: SettingsMap): PayoutConfig {
  const min = Number(settings.payout_min_amount)
  const hold = Number(settings.payout_hold_days)
  return {
    minAmount: Number.isFinite(min) && min > 0 ? Math.min(Math.round(min), 10_000_000) : 1000,
    holdDays: Number.isFinite(hold) && hold >= 0 ? Math.min(Math.round(hold), 90) : 7,
  }
}

export async function loadPayoutConfig(): Promise<PayoutConfig> {
  const { getPlatformSettings } = await import('@/lib/plans')
  return getPayoutConfig(await getPlatformSettings())
}

export interface PayoutAccountInput {
  method: string
  holderName: string
  account: string
  key?: string
}

/**
 * Validates the destination account for a real transfer. Returns an Arabic
 * error message, or null when the account is acceptable.
 */
export function validatePayoutAccount(input: PayoutAccountInput): string | null {
  const method = input.method as PayoutMethod
  if (!PAYOUT_METHODS.includes(method)) return 'طريقة السحب غير مدعومة'

  const holder = (input.holderName || '').trim()
  if (holder.length < 3 || holder.length > 100) return 'اسم صاحب الحساب مطلوب (3-100 حرف)'

  const digits = (input.account || '').replace(/[\s-]/g, '')
  if (method === 'ccp') {
    if (!/^\d{6,10}$/.test(digits)) return 'رقم حساب CCP غير صالح (6-10 أرقام)'
    if (!/^\d{1,2}$/.test((input.key || '').trim())) return 'مفتاح CCP (Clé) غير صالح (1-2 أرقام)'
  } else if (method === 'rip') {
    if (!/^\d{20}$/.test(digits)) return 'رقم RIP البنكي غير صالح (20 رقمًا)'
  } else {
    if (!/^0[567]\d{8}$/.test(digits)) return 'رقم الهاتف لبريدي موب غير صالح (مثال: 05XXXXXXXX)'
  }
  return null
}

/**
 * Moves matured earnings from pending to available. Funds unlock HOLD_DAYS
 * after the order is paid (chargeback/refund window). Idempotent: already
 * released money (available + paid out) is never moved twice.
 */
export async function releaseMaturedBalances(creatorId: string): Promise<{ released: number }> {
  const creator = await prisma.creatorProfile.findUnique({ where: { id: creatorId } })
  if (!creator || creator.pendingBalance <= 0) return { released: 0 }

  const config = await loadPayoutConfig()
  const matureBefore = new Date(Date.now() - config.holdDays * 24 * 60 * 60 * 1000)

  const [eligible, paidOut] = await Promise.all([
    prisma.order
      .aggregate({
        where: { sellerId: creatorId, status: 'PAID', createdAt: { lte: matureBefore } },
        _sum: { sellerEarnings: true },
      })
      .then((r) => r._sum.sellerEarnings || 0),
    prisma.transaction
      .aggregate({ where: { type: 'PAYOUT', userId: creator.userId }, _sum: { amount: true } })
      .then((r) => Math.abs(r._sum.amount || 0)),
  ])

  const alreadyReleased = creator.availableBalance + paidOut
  const due = Math.max(0, Math.min(eligible - alreadyReleased, creator.pendingBalance))
  if (due <= 0) return { released: 0 }

  const moved = await prisma.creatorProfile.updateMany({
    where: { id: creatorId, pendingBalance: { gte: due } },
    data: { pendingBalance: { decrement: due }, availableBalance: { increment: due } },
  })
  return { released: moved.count > 0 ? due : 0 }
}
