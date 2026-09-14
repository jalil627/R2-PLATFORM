'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import SmartImage from '@/components/ui/smart-image'
import { formatCurrency } from '@/lib/utils'

const buyerLinks = [
  { label: 'نظرة عامة', href: '/dashboard', icon: 'dashboard' },
  { label: 'مشترياتي', href: '/dashboard/purchases', icon: 'products' },
  { label: 'طلباتي', href: '/dashboard/orders', icon: 'orders' },
  { label: 'المفضلة', href: '/dashboard/wishlist', icon: 'earnings' },
  { label: 'الإعدادات', href: '/dashboard/settings', icon: 'settings' },
]

interface PurchaseItem {
  price?: number | null
  productId?: string | null
  product?: {
    title?: string | null
    thumbnail?: string | null
    isFree?: boolean
  } | null
}

interface BuyerPurchaseOrder {
  id: string
  status: string
  seller?: { user?: { name?: string | null } | null } | null
  items?: PurchaseItem[] | null
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<BuyerPurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders?role=buyer')
      .then(r => r.json())
      .then(d => { setPurchases(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const paid = purchases.filter(o => o.status === 'PAID')

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={buyerLinks} title="حسابي" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="مشترياتي" subtitle={`${paid.length} منتج`} />

        {loading ? (
          <div className="space-y-3">{['1','2','3'].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : paid.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <p className="text-gray-500 mb-4">لم تشترِ أي منتجات بعد</p>
                <Link href="/marketplace"><Button>استكشف السوق</Button></Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paid.map((order) => {
              const item = order.items?.[0]
              const product = item?.product
              return (
                <Card key={order.id}>
                  <CardContent>
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                      {product?.thumbnail ? (
                        <SmartImage src={product.thumbnail} alt={product.title || 'منتج'} className="object-cover" />
                      ) : (
                        <svg className="w-10 h-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{product?.title || 'منتج'}</h3>
                    <p className="text-sm text-gray-500 mb-3">{order.seller?.user?.name || ''}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{formatCurrency(item?.price || 0)}</span>
                      <Link href={`/api/downloads/${item?.productId}`} className="text-sm text-blue-700 hover:text-blue-600 font-medium">
                        {product?.isFree ? 'تحميل' : 'تحميل'}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
