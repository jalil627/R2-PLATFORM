import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const supportsInsensitive = (process.env.DATABASE_URL || '').startsWith('postgres')

export function like(value: string) {
  return supportsInsensitive ? { contains: value, mode: 'insensitive' as const } : { contains: value }
}

export const AR_LATN_LOCALE = 'ar-DZ-u-nu-latn'

/**
 * Clamps user-supplied pagination so a request like `?pageSize=100000000`
 * can't turn into an unbounded `take` and exhaust memory.
 */
export function parsePagination(
  searchParams: URLSearchParams,
  { defaultPageSize = 12, maxPageSize = 50 }: { defaultPageSize?: number; maxPageSize?: number } = {}
): { page: number; pageSize: number; skip: number } {
  const rawPage = Number.parseInt(searchParams.get('page') || '1', 10)
  const rawPageSize = Number.parseInt(searchParams.get('pageSize') || String(defaultPageSize), 10)

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.min(rawPage, 10_000) : 1
  const pageSize = Number.isFinite(rawPageSize) && rawPageSize > 0
    ? Math.min(rawPageSize, maxPageSize)
    : defaultPageSize

  return { page, pageSize, skip: (page - 1) * pageSize }
}

/**
 * Returns the URL only if it is a plain http(s) link, otherwise null.
 * Blocks `javascript:`, `data:` and other script-bearing schemes from ever
 * reaching an `href` (stored XSS via user-supplied profile/store links).
 */
export function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 2048) return null
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}

export function formatCurrency(amount: number, currency = 'DZD'): string {
  // Whole dinars stay clean (1500 دج, not 1,500.00) — fractions keep up to 2 decimals.
  return new Intl.NumberFormat(AR_LATN_LOCALE, { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount) + ' ' + currency
}

export function formatDate(date: Date | string, locale = 'ar-u-nu-latn'): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date))
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'الآن'
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`
  if (diffHour < 24) return `منذ ${diffHour} ساعة`
  if (diffDay < 30) return `منذ ${diffDay} يوم`
  return formatDate(date)
}

export function slugify(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640\u06D6-\u06ED]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `R2-${timestamp}-${random}`
}

export function generateAffiliateCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

export function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

export function calculateDiscount(price: number, compareAtPrice: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
}

export function calculatePlatformFee(amount: number, feePercent: number): number {
  return Math.round(amount * (feePercent / 100) * 100) / 100
}

export function calculateSellerEarnings(amount: number, platformFee: number, paymentFee: number): number {
  return Math.round((amount - platformFee - paymentFee) * 100) / 100
}

export const ROLES = {
  BUYER: 'BUYER',
  CREATOR: 'CREATOR',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const

export const PRODUCT_STATUSES = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const

export const ORDER_STATUSES = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
} as const

export const CURRENCIES = {
  DZD: { symbol: 'د.ج', name: 'دينار جزائري', locale: 'ar-DZ' },
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
} as const
