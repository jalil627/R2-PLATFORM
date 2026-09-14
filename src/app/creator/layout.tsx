import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { isCreator } from '@/lib/auth/permissions'
import type { UserRole } from '@/types'

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const role = (session?.user as { role?: UserRole } | undefined)?.role

  if (!session?.user || !role || !isCreator(role)) {
    redirect('/dashboard')
  }

  return <>{children}</>
}