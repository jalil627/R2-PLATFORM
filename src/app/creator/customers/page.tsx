'use client'

import { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Input from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

const creatorLinks = [
  { label: 'نظرة عامة', href: '/creator/dashboard', icon: 'dashboard' },
  { label: 'المنتجات', href: '/creator/products', icon: 'products' },
  { label: 'الطلبات', href: '/creator/orders', icon: 'orders' },
  { label: 'العملاء', href: '/creator/customers', icon: 'customers' },
  { label: 'الإحصائيات', href: '/creator/analytics', icon: 'analytics' },
  { label: 'الأرباح', href: '/creator/earnings', icon: 'earnings' },
  { label: 'الكوبونات', href: '/creator/coupons', icon: 'coupons' },
  { label: 'التسويق بالعمولة', href: '/creator/affiliates', icon: 'affiliate' },
  { label: 'المدفوعات', href: '/creator/payouts', icon: 'payouts' },
  { label: 'إعدادات المتجر', href: '/creator/settings', icon: 'settings' },
]

interface CustomerOrder {
  buyerId: string
  status: string
  grossAmount: number
  createdAt: string
  buyer?: { name?: string | null; email?: string | null } | null
}

interface CustomerRow {
  id: string
  name?: string | null
  email: string
  count: number
  total: number
  last: string
}

export default function CreatorCustomersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/orders?role=seller')
      .then(r => r.json())
      .then(d => { setOrders(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const customers = useMemo(() => {
    const paid = orders.filter(o => o.status === 'PAID')
    const map = new Map<string, CustomerRow>()
    for (const o of paid) {
      const key = o.buyerId
      if (!map.has(key)) {
        map.set(key, { id: key, name: o.buyer?.name || o.buyer?.email, email: o.buyer?.email || '', count: 0, total: 0, last: o.createdAt })
      }
      const c = map.get(key)
      if (!c) continue
      c.count += 1
      c.total += o.grossAmount
      if (new Date(o.createdAt) > new Date(c.last)) c.last = o.createdAt
    }
    return Array.from(map.values())
  }, [orders])

  const filtered = customers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={creatorLinks} title="لوحة التحكم" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="العملاء" subtitle={customers.length > 0 ? `${customers.length} عميل` : ''} />

        <div className="max-w-md mb-6">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن عميل بالاسم أو البريد..." />
        </div>

        <Card>
          {loading ? (
            <CardContent><div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div></CardContent>
          ) : filtered.length === 0 ? (
            <CardContent><p className="text-center text-gray-500 py-12">{customers.length === 0 ? 'لا يوجد عملاء بعد' : 'لا توجد نتائج مطابقة'}</p></CardContent>
          ) : (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
                      <th className="px-4 py-3 font-medium">العميل</th>
                      <th className="px-4 py-3 font-medium">البريد</th>
                      <th className="px-4 py-3 font-medium">عدد المشتريات</th>
                      <th className="px-4 py-3 font-medium">إجمالي الإنفاق</th>
                      <th className="px-4 py-3 font-medium">آخر شراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 text-sm text-gray-900">{c.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{c.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{c.count}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(c.total)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(c.last).toLocaleDateString('ar')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      </main>
    </div>
  )
}