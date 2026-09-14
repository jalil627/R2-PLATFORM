import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'
import { like, parsePagination } from '@/lib/utils'

// ─── Direct catalog reads ──────────────────────────────────────────────
// Server pages call these instead of HTTP-fetching our own API routes,
// which saves a full HTTP round-trip (proxy + serialize + parse) per load.
// The /api/* routes below wrap the same functions, so responses stay identical.

export interface ProductListParams {
  page?: string
  pageSize?: string
  search?: string
  category?: string
  sort?: string
  minPrice?: string
  maxPrice?: string
  minRating?: string
  type?: string
  isFree?: string
  isFeatured?: string
  creatorId?: string
  /** Resolved status filter: 'all' | concrete status | undefined (= public APPROVED only) */
  status?: string
}

const productListInclude = {
  creator: { include: { user: { select: { name: true, avatar: true } } } },
  store: { select: { name: true, slug: true } },
  images: { take: 1, orderBy: { position: 'asc' } },
  categories: { include: { category: { select: { name: true, nameAr: true, slug: true } } } },
  _count: { select: { reviews: true, orderItems: true, downloads: true } },
} satisfies Prisma.ProductInclude

export type ListedProduct = Prisma.ProductGetPayload<{ include: typeof productListInclude }>

export async function listProducts(params: ProductListParams): Promise<{
  products: ListedProduct[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const searchParams = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') searchParams.set(k, v)
  }

  const { page, pageSize, skip } = parsePagination(searchParams)
  const search = params.search || ''
  const category = params.category || ''
  const sort = params.sort || 'newest'
  const minPrice = params.minPrice ? parseFloat(params.minPrice) : undefined
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : undefined
  const minRating = params.minRating ? parseFloat(params.minRating) : undefined
  const type = params.type || ''
  const isFree = params.isFree === 'true'
  const isFeatured = params.isFeatured === 'true'
  const creatorId = params.creatorId || ''
  const status = params.status || ''

  const where: Prisma.ProductWhereInput =
    status === 'all' ? {} : status ? { status: status as Prisma.ProductWhereInput['status'] } : { status: 'APPROVED' }

  if (search) {
    where.OR = [
      { title: like(search) },
      { description: like(search) },
      { tags: { some: { tag: { name: like(search) } } } },
    ]
  }

  if (category) {
    where.categories = { some: { category: { slug: category } } }
  }

  if (type) where.type = type as Prisma.ProductWhereInput['type']
  if (isFree) where.isFree = true
  if (isFeatured) where.isFeatured = true
  if (creatorId) where.creatorId = creatorId

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}
    if (minPrice !== undefined) where.price.gte = minPrice
    if (maxPrice !== undefined) where.price.lte = maxPrice
  }

  if (minRating !== undefined) {
    where.rating = { gte: minRating }
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
    switch (sort) {
      case 'best-selling': return { downloadCount: 'desc' }
      case 'trending': return { viewCount: 'desc' }
      case 'price-low': return { price: 'asc' }
      case 'price-high': return { price: 'desc' }
      case 'rating': return { rating: 'desc' }
      case 'newest':
      default: return { createdAt: 'desc' }
    }
  })()

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip, take: pageSize, include: productListInclude }),
    prisma.product.count({ where }),
  ])

  return { products, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { products: true } },
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { products: true } } },
      },
    },
  })
}

export async function getStoreWithProducts(slug: string) {
  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      user: { select: { name: true, avatar: true, creatorProfile: { select: { isVerified: true } } } },
    },
  })

  if (!store) return null

  const products = await prisma.product.findMany({
    where: { storeId: store.id, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { include: { user: { select: { name: true, avatar: true } } } },
      store: { select: { name: true, slug: true } },
      images: { take: 1 },
      _count: { select: { reviews: true } },
    },
  })

  return {
    store: {
      ...store,
      isVerified: store.user.creatorProfile?.isVerified || false,
    },
    products,
  }
}
