import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { isAdmin, isCreator } from '@/lib/auth/permissions'
import type { UserRole } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const role = (session?.user as { role?: UserRole } | undefined)?.role

  if (!session?.user) {
    redirect('/auth/login')
  }

  if (role && isAdmin(role)) {
    redirect('/admin')
  }

  if (role && isCreator(role)) {
    redirect('/creator/dashboard')
  }

  return <>{children}</>
}