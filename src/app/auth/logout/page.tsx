'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    signOut({ redirect: false }).then(() => {
      router.push('/')
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">جاري تسجيل الخروج...</p>
      </div>
    </div>
  )
}
