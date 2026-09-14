import { auth } from './config'
import type { Session } from 'next-auth'
import { UserRole } from '@/types'

const ROLE_HIERARCHY: Record<UserRole, number> = {
  BUYER: 0,
  CREATOR: 1,
  MODERATOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
}

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
  avatar: string | null
}

export function getSessionUser(session: Session | null): SessionUser | null {
  if (!session?.user) return null
  return session.user as SessionUser
}

export async function getCurrentUser() {
  const session = await auth()
  return getSessionUser(session)
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export async function requireRole(minRole: UserRole) {
  const user = await requireAuth()
  if (ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[minRole]) {
    throw new Error('FORBIDDEN')
  }
  return user
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function isAdmin(role: UserRole): boolean {
  return hasRole(role, 'ADMIN')
}

export function isCreator(role: UserRole): boolean {
  return hasRole(role, 'CREATOR')
}

export function canModerate(role: UserRole): boolean {
  return hasRole(role, 'MODERATOR')
}

export { canAccessSection, hasAdminAccess, sectionsForRole } from '@/lib/admin-sections'
export type { AdminSection } from '@/lib/admin-sections'
