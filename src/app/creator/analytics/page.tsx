'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import { formatCurrency } from '@/lib/utils'
import { ProLocked, useProGate } from '@/components/creator/pro-lock'

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

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

interface AnalyticsStats {
  totalRevenue?: number
  totalOrders?: number
  dailyRevenue?: { date?: string | null; amount?: number | null }[]
}

interface AnalyticsOrder {
  id: string
  status: string
  grossAmount: number
}

export default function CreatorAnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats>({})
  const [orders, setOrders] = useState<AnalyticsOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/creator/dashboard').then(r => r.json()),
      fetch('/api/orders?role=seller').then(r => r.json()),
    ]).then(([d, o]) => {
      setStats(d?.data?.stats || {})
      setOrders((o?.data || []).filter((x: AnalyticsOrder) => x.status === 'PAID'))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const paidOrders = orders
  const avgOrderValue = paidOrders.length ? paidOrders.reduce((s, o) => s + o.grossAmount, 0) / paidOrders.length : 0

  const monthly = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of stats.dailyRevenue || []) {
      const key = (d.date || '').slice(0, 7)
      if (key) map.set(key, (map.get(key) || 0) + (d.amount || 0))
    }
    const out: { label: string; amount: number }[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      out.push({ label: MONTHS[d.getMonth()], amount: map.get(key) || 0 })
    }
    return out
  }, [stats])

  const maxMonthly = Math.max(1, ...monthly.map(m => m.amount))

  const gate = useProGate()
  const locked = !gate.loading && !gate.isPro

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={creatorLinks} title="لوحة التحكم" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="الإحصائيات" />
        <ProLocked locked={locked}>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card><CardContent>
                <p className="text-sm text-gray-500 mb-1">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue || 0)}</p>
              </CardContent></Card>
              <Card><CardContent>
                <p className="text-sm text-gray-500 mb-1">متوسط قيمة الطلب</p>
                <p className="text-2xl font-bold text-gray-900">{paidOrders.length ? formatCurrency(avgOrderValue) : '—'}</p>
              </CardContent></Card>
              <Card><CardContent>
                <p className="text-sm text-gray-500 mb-1">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
              </CardContent></Card>
            </div>

            <Card>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-6">الإيرادات الشهرية (آخر 12 شهرًا)</h3>
                {stats.dailyRevenue?.length ? (
                  <>
                    <div className="h-56 flex items-end gap-1.5 sm:gap-2">
                      {monthly.map((m, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group" title={`${m.label}: ${formatCurrency(m.amount)}`}>
                          <div
                            className="w-full bg-gradient-to-t from-blue-700 to-blue-400 rounded-t-lg transition-all group-hover:brightness-110 min-h-[3px]"
                            style={{ height: `${Math.max(2, (m.amount / maxMonthly) * 100)}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5 sm:gap-2 mt-2">
                      {monthly.map((m, i) => (
                        <span key={i} className="flex-1 text-center text-[10px] sm:text-xs text-gray-500 truncate">{m.label}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-500 py-10">لا توجد مبيعات بعد — ستظهر الإحصائيات هنا من أول عملية بيع.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
        </ProLocked>
      </main>
    </div>
  )
}