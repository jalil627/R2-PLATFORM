'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  PAID: { label: 'مدفوع', variant: 'success' },
  PENDING: { label: 'قيد الانتظار', variant: 'warning' },
  PROCESSING: { label: 'قيد المعالجة', variant: 'warning' },
  FAILED: { label: 'فشل', variant: 'danger' },
  REFUNDED: { label: 'مسترجع', variant: 'default' },
  CANCELLED: { label: 'ملغي', variant: 'danger' },
}

interface CreatorOrder {
  id: string
  orderNumber?: string | null
  status: string
  grossAmount: number
  sellerEarnings?: number | null
  createdAt: string
  buyer?: { name?: string | null; email?: string | null } | null
  items?: { product?: { title?: string | null } | null }[] | null
}

export default function CreatorOrdersPage() {
  const [orders, setOrders] = useState<CreatorOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders?role=seller')
      .then(r => r.json())
      .then(d => { setOrders(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={creatorLinks} title="لوحة التحكم" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="الطلبات" subtitle={`${orders.length} طلب`} />

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <Card><CardContent><p className="text-center text-gray-500 py-12">لا توجد طلبات بعد</p></CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
                      <th className="px-4 py-3 font-medium">رقم الطلب</th>
                      <th className="px-4 py-3 font-medium">العميل</th>
                      <th className="px-4 py-3 font-medium">المنتج</th>
                      <th className="px-4 py-3 font-medium">المبلغ</th>
                      <th className="px-4 py-3 font-medium">أرباحك</th>
                      <th className="px-4 py-3 font-medium">الحالة</th>
                      <th className="px-4 py-3 font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.buyer?.name || order.buyer?.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.items?.[0]?.product?.title || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(order.grossAmount)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-emerald-600">{formatCurrency(order.sellerEarnings || 0)}</td>
                        <td className="px-4 py-3"><Badge variant={statusMap[order.status]?.variant || 'default'}>{statusMap[order.status]?.label || order.status}</Badge></td>
                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('ar')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
