import 'server-only'
import { unstable_cache } from 'next/cache'
import prisma from '@/lib/db'

const productInclude = {
  creator: { include: { user: { select: { name: true } } } },
  images: { take: 1, orderBy: { position: 'asc' as const } },
  _count: { select: { reviews: true } },
}

const LIVE_CACHE = { revalidate: 60 }
const SLOW_CACHE = { revalidate: 300 }

export const getCachedStats = unstable_cache(
  async () => {
    const [productCount, creatorCount, paidOrders, downloadsAgg] = await Promise.all([
      prisma.product.count({ where: { status: 'APPROVED' } }),
      prisma.user.count({ where: { role: 'CREATOR' } }),
      prisma.order.count({ where: { status: 'PAID' } }),
      prisma.product.aggregate({ _sum: { downloadCount: true } }),
    ])
    return {
      products: productCount,
      creators: creatorCount,
      sales: paidOrders,
      downloads: downloadsAgg._sum.downloadCount || 0,
    }
  },
  ['home-stats'],
  LIVE_CACHE
)

export const getCachedWeekStrip = unstable_cache(
  () =>
    prisma.product.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ downloadCount: 'desc' }, { createdAt: 'desc' }],
      take: 8,
      include: productInclude,
    }),
  ['home-strip'],
  LIVE_CACHE
)

export const getCachedLatest = unstable_cache(
  () =>
    prisma.product.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: productInclude,
    }),
  ['home-latest'],
  LIVE_CACHE
)

export const getCachedTopDownloads = unstable_cache(
  (excludeIds: string[]) => {
    if (excludeIds.length === 0) return Promise.resolve([])
    return prisma.product.findMany({
      where: { status: 'APPROVED', id: { notIn: excludeIds } },
      orderBy: { downloadCount: 'desc' },
      take: 6,
      include: productInclude,
    })
  },
  ['home-top'],
  LIVE_CACHE
)

export const getCachedFreePicks = unstable_cache(
  () =>
    prisma.product.findMany({
      where: { status: 'APPROVED', isFree: true },
      orderBy: { downloadCount: 'desc' },
      take: 6,
      include: productInclude,
    }),
  ['home-free'],
  LIVE_CACHE
)

export const getCachedTopCreators = unstable_cache(
  () =>
    prisma.creatorProfile.findMany({
      where: { user: { isActive: true, isBanned: false } },
      orderBy: [{ totalSales: 'desc' }, { totalEarnings: 'desc' }],
      take: 6,
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
            store: { select: { name: true, slug: true, logo: true } },
          },
        },
        _count: { select: { products: true } },
      },
    }),
  ['home-creators'],
  LIVE_CACHE
)

export const getCachedCategories = unstable_cache(
  () =>
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 8,
      include: { _count: { select: { products: true } } },
    }),
  ['home-categories'],
  SLOW_CACHE
)

export const getCachedTestimonials = unstable_cache(
  () =>
    prisma.review.findMany({
      where: { isHidden: false, text: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        user: { select: { name: true } },
        product: { select: { title: true, slug: true } },
      },
    }),
  ['home-testimonials'],
  SLOW_CACHE
)

export const getCachedPlatformSettings = unstable_cache(
  async () => {
    const rows = await prisma.platformSetting.findMany()
    return rows
  },
  ['platform-settings'],
  { revalidate: 30, tags: ['platform-settings'] }
)