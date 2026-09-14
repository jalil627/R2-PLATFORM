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

interface WishlistProduct {
  id: string
  title: string
  thumbnail?: string | null
  price: number
  isFree?: boolean
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wishlist')
      .then(r => r.json())
      .then(d => { setItems(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function remove(productId: string) {
    await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) })
    setItems(items.filter(i => i.id !== productId))
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={buyerLinks} title="حسابي" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="المفضلة" subtitle={`${items.length} منتج`} />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <Card><CardContent>
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              <p className="text-gray-500 mb-4">مفضلتك فارغة</p>
              <Link href="/marketplace"><Button>استكشف السوق</Button></Link>
            </div>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((product) => (
              <Card key={product.id}>
                <CardContent>
                  <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-100 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                    {product.thumbnail ? <SmartImage src={product.thumbnail} alt={product.title} className="object-cover" /> : <svg className="w-10 h-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                    <button onClick={() => remove(product.id)} className="absolute top-2 right-2 p-2 rounded-full bg-white/90 shadow-sm hover:bg-blue-50 text-blue-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{product.isFree ? 'مجاني' : formatCurrency(product.price)}</span>
                    <Link href={`/checkout?product=${product.id}`} className="text-sm text-blue-700 hover:text-blue-600 font-medium">شراء</Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
