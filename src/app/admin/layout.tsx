import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { hasAdminAccess } from '@/lib/auth/permissions'
import type { UserRole } from '@/types'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const role = (session?.user as { role?: UserRole } | undefined)?.role

  if (!session?.user || !role || !hasAdminAccess(role)) {
    redirect('/')
  }

  return <>{children}</>
}