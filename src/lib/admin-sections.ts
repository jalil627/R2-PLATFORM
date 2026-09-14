// Role → admin-section map. Pure data + functions only (no server imports)
// so both API routes AND client components (sidebar) can use it.

export type AdminSection =
  | 'overview'
  | 'users'
  | 'creators'
  | 'products'
  | 'categories'
  | 'orders'
  | 'payouts'
  | 'treasury'
  | 'coupons'
  | 'reviews'
  | 'reports'
  | 'complaints'
  | 'subscriptions'
  | 'affiliates'
  | 'messages'
  | 'audit'
  | 'alerts'
  | 'settings'

const ALL_SECTIONS: AdminSection[] = [
  'overview', 'users', 'creators', 'products', 'categories', 'orders',
  'payouts', 'treasury', 'coupons', 'reviews', 'reports', 'complaints',
  'subscriptions', 'affiliates', 'messages', 'audit', 'alerts', 'settings',
]

const MODERATOR_SECTIONS: AdminSection[] = ['overview', 'products', 'reviews', 'reports', 'complaints']

// ADMIN sees everything except platform settings (SUPER_ADMIN only).
const ADMIN_SECTIONS: AdminSection[] = ALL_SECTIONS.filter((s) => s !== 'settings')

export function sectionsForRole(role: string | null | undefined): AdminSection[] {
  if (role === 'SUPER_ADMIN') return ALL_SECTIONS
  if (role === 'ADMIN') return ADMIN_SECTIONS
  if (role === 'MODERATOR') return MODERATOR_SECTIONS
  return []
}

export function canAccessSection(role: string | null | undefined, section: AdminSection | string): boolean {
  return sectionsForRole(role).includes(section as AdminSection)
}

export function hasAdminAccess(role: string | null | undefined): boolean {
  return sectionsForRole(role).length > 0
}
