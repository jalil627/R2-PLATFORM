'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'

const buyerLinks = [
  { label: 'نظرة عامة', href: '/dashboard', icon: 'dashboard' },
  { label: 'مشترياتي', href: '/dashboard/purchases', icon: 'products' },
  { label: 'طلباتي', href: '/dashboard/orders', icon: 'orders' },
  { label: 'المفضلة', href: '/dashboard/wishlist', icon: 'earnings' },
  { label: 'الإعدادات', href: '/dashboard/settings', icon: 'settings' },
]

interface BuyerPurchase {
  id: string
  status: string
  createdAt: string
  items?: { product?: { title?: string | null } | null; productId?: string | null }[] | null
}

export default function BuyerDashboardPage() {
  const [purchases, setPurchases] = useState<BuyerPurchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders?role=buyer')
      .then(r => r.json())
      .then(d => { setPurchases(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={buyerLinks} title="حسابي" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="لوحة التحكم" subtitle="مرحبًا بك في حسابك" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent>
              <p className="text-sm text-gray-500 mb-1">المشتريات</p>
              <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-gray-500 mb-1">المفضلة</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-gray-500 mb-1">المبدعون المتابعون</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">مشترياتي الأخيرة</h3>
              <Link href="/dashboard/purchases" className="text-sm text-blue-700 hover:text-blue-600">عرض الكل</Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">لم تشتري أي منتجات بعد</p>
                <Link href="/marketplace"><Button>استكشف السوق</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.slice(0, 5).map((order: BuyerPurchase) => (
                  <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{order.items?.[0]?.product?.title || 'منتج'}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('ar')}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {order.status === 'PAID' ? 'مدفوع' : order.status}
                    </span>
                    <Link href={`/api/downloads/${order.items?.[0]?.productId}`} className="text-xs text-blue-700 hover:text-blue-600 font-medium">تحميل</Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
