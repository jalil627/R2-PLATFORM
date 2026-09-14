'use client'

import { useEffect, useState } from 'react'
import HomeHeader from '@/components/layout/home-header'
import { dashHrefFor, type SiteUser } from '@/components/layout/header-utils'

/** Session-aware header for client pages (help, faq, contact, complaints). */
export default function SessionHeader() {
  const [user, setUser] = useState<SiteUser | null>(null)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (d?.data) setUser(d.data)
      })
      .catch(() => {})
  }, [])

  return <HomeHeader user={user} dashHref={dashHrefFor(user)} />
}
