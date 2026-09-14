import { auth } from '@/lib/auth/config'
import HomeHeader from '@/components/layout/home-header'
import { dashHrefFor, type SiteUser } from '@/components/layout/header-utils'

/** Session-aware header for server pages (features, categories, legal, …). */
export default async function SiteHeader() {
  const session = await auth()
  const user = (session?.user as SiteUser | undefined) ?? null
  return <HomeHeader user={user} dashHref={dashHrefFor(user)} />
}
