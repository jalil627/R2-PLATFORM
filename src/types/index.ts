import type {
  CreatorProfile, Store, Product, ProductFile, ProductImage, Category, Tag, Order, OrderItem, Payment, Coupon, Review,
} from '@prisma/client'

export type {
  User, Profile, CreatorProfile, Store, Product, ProductFile, ProductImage, Category, Tag, Order, OrderItem, Payment, Payout, Coupon, Review, Wishlist, Follow, AffiliateLink, AffiliateClick, AffiliateConversion, Notification, Download, Refund, Report, AuditLog, PlatformSetting, ProductVersion, CreatorAnalytics, SupportTicket, SupportTicketReply, HomepageSection, EmailTemplate, Transaction,
} from '@prisma/client'

export type UserRole = 'BUYER' | 'CREATOR' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN'
export type ProductStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
export type PayoutStatus = 'REQUESTED' | 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED'

export interface SessionUser {
  id: string
  email: string
  name: string | null
  role: UserRole
  avatar: string | null
}

export interface ProductWithRelations extends Product {
  creator: CreatorProfile & { user: { name: string | null; avatar: string | null } }
  store?: Store | null
  files: ProductFile[]
  images: ProductImage[]
  categories: { category: Category }[]
  tags: { tag: Tag }[]
  reviews: Review[]
  _count?: { reviews: number; orderItems: number; downloads: number }
}

export interface OrderWithRelations extends Order {
  buyer: { name: string | null; email: string; avatar: string | null }
  seller: CreatorProfile & { user: { name: string | null } }
  items: (OrderItem & { product: Product & { thumbnail: string | null } })[]
  payment?: Payment | null
  coupon?: Coupon | null
}

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  pendingBalance: number
  availableBalance: number
  revenueChange: number
  ordersChange: number
}

export interface AdminDashboardStats {
  totalGMV: number
  platformRevenue: number
  totalCreators: number
  activeCreators: number
  totalBuyers: number
  totalOrders: number
  totalProducts: number
  totalDownloads: number
  conversionRate: number
  refundRate: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface MarketplaceFilters {
  search?: string
  category?: string
  tag?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  type?: string
  sort?: 'newest' | 'best-selling' | 'trending' | 'price-low' | 'price-high' | 'rating'
  creatorId?: string
  isFree?: boolean
  isDiscounted?: boolean
  isFeatured?: boolean
  page?: number
  pageSize?: number
}
