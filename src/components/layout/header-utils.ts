export interface SiteUser {
  role?: string | null
  name?: string | null
  email?: string | null
  avatar?: string | null
}

export function dashHrefFor(user: SiteUser | null): string {
  if (!user) return '/auth/register'
  const role = user.role || ''
  if (role === 'CREATOR' || role === 'SUPER_ADMIN') return '/creator/dashboard'
  if (role === 'ADMIN' || role === 'MODERATOR') return '/admin'
  return '/dashboard'
}
