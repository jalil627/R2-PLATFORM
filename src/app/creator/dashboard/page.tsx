'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'
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
  { label: 'الخطة والاشتراك', href: '/creator/plans', icon: 'subscriptions' },
  { label: 'المدفوعات', href: '/creator/payouts', icon: 'payouts' },
  { label: 'إعدادات المتجر', href: '/creator/settings', icon: 'settings' },
]

const ICONS: Record<string, string> = {
  revenue: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
  orders: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  customers: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  products: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  plus: 'M12 4v16m8-8H4',
  tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
  wallet: 'M3 10h18M7 15h3m-5 4h12a2 2 0 002-2V8a2 2 0 00-2-2H7a2 2 0 00-2 2v9zm0 0H4a2 2 0 00-2 2v1h20v-1a2 2 0 00-2-2h-1',
}

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[name] ?? ICONS.products} />
    </svg>
  )
}

function KpiCard({ icon, label, value, sub, tone }: { icon: string; label: string; value: string; sub?: string; tone: 'blue' | 'emerald' | 'violet' | 'amber' }) {
  const tones = {
    blue: 'bg-[var(--primary-soft)] text-[var(--primary-strong)]',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  } as const
  return (
    <Card hover>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-gray-900 truncate">{value}</p>
            {sub && <p className="mt-1 text-xs font-medium text-gray-400">{sub}</p>}
          </div>
          <span className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${tones[tone]}`}>
            <Icon name={icon} className="w-5 h-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

interface DashboardTopProduct {
  id: string
  title: string
  price: number
  downloadCount?: number | null
  rating?: number | null
}

interface DashboardRecentOrder {
  id: string
  status: string
  grossAmount: number
  createdAt: string
  buyer?: { name?: string | null; email?: string | null } | null
  items?: { product?: { title?: string | null } | null }[] | null
}

interface CreatorDashboardData {
  stats?: {
    totalRevenue?: number
    totalOrders?: number
    totalCustomers?: number
    totalProducts?: number
    pendingBalance?: number
    availableBalance?: number
    revenueChange?: number
    thisMonth?: { count?: number }
  } | null
  plan?: { plan?: string; isPro?: boolean; daysLeft?: number } | null
  recentOrders?: DashboardRecentOrder[] | null
  topProducts?: DashboardTopProduct[] | null
}

export default function CreatorDashboardPage() {
  const [data, setData] = useState<CreatorDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/creator/dashboard')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        setData(d.data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const stats = data?.stats
  const plan = data?.plan || { plan: 'FREE', isPro: false, daysLeft: 0 }
  const recentOrders = data?.recentOrders || []
  const topProducts = data?.topProducts || []
  const revenueChange = stats?.revenueChange || 0

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={creatorLinks} title="لوحة التحكم" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="لوحة تحكم المبدع" subtitle="نظرة عامة على متجرك" />

        {/* ── Hero summary band ─────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[var(--section-tint)] to-white border border-gray-200 shadow-[var(--shadow-sm)] p-6 sm:p-8 mb-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'radial-gradient(40rem 20rem at 95% -20%, rgba(59,109,246,0.14) 0%, transparent 55%), radial-gradient(30rem 18rem at 0% 120%, rgba(245,158,11,0.10) 0%, transparent 55%)',
            }}
          />
          <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <p className="overline-label text-[11px] text-[var(--primary-strong)]">R2 · CREATOR</p>
                {plan.isPro ? (
                  <span className="px-2.5 py-0.5 rounded-full brand-gradient text-white text-[11px] font-black">PRO</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-black">مجانية</span>
                )}
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tabular-nums text-[var(--ink)] display-tight">
                {loading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
                <span className="text-base font-bold text-gray-400"> إجمالي الإيرادات</span>
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {loading ? 'جاري التحميل...' : (
                  <>
                    {stats?.totalOrders || 0} طلب · {stats?.totalCustomers || 0} عميل
                    {revenueChange !== 0 && (
                      <span className={`font-bold ${revenueChange > 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {' '}({revenueChange > 0 ? '+' : ''}{revenueChange.toFixed(1)}% عن الشهر الماضي)
                      </span>
                    )}
                    {!plan.isPro && <span className="mx-2 text-gray-300">·</span>}
                    {!plan.isPro && (
                      <Link href="/creator/plans" className="font-bold text-[var(--primary-strong)] hover:underline">رقِّ إلى برو</Link>
                    )}
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/creator/products/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold brand-gradient text-white shadow-[0_10px_24px_-10px_rgba(37,78,219,0.7)] hover:brightness-110 transition-all">
                <Icon name="plus" className="w-4 h-4" />
                منتج جديد
              </Link>
              <Link href="/creator/coupons" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border border-gray-300 bg-white text-[var(--ink)] hover:border-[var(--a-400)] transition-colors">
                <Icon name="tag" className="w-4 h-4" />
                كوبون جديد
              </Link>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* ── KPI cards ─────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard icon="revenue" label="الإيرادات" value={formatCurrency(stats?.totalRevenue || 0)} sub={`هذا الشهر: ${stats?.thisMonth?.count || 0} طلب`} tone="blue" />
              <KpiCard icon="orders" label="الطلبات" value={String(stats?.totalOrders || 0)} sub={`المعلق: ${formatCurrency(stats?.pendingBalance || 0)}`} tone="violet" />
              <KpiCard icon="customers" label="العملاء" value={String(stats?.totalCustomers || 0)} sub="إجمالي المشترين" tone="emerald" />
              <KpiCard icon="products" label="المنتجات" value={String(stats?.totalProducts || 0)} sub="منتج منشور" tone="amber" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6">
              {/* ── Balance & payout ────────────────────────── */}
              <Card className="xl:col-span-2">
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-extrabold text-[var(--ink)]">رصيد الأرباح</h3>
                      <p className="text-xs text-gray-500 mt-0.5">اسحب رصيدك المتاح في أي وقت</p>
                    </div>
                    <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Icon name="wallet" className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="rounded-2xl brand-gradient text-white p-5 mb-3">
                    <p className="text-xs font-semibold text-blue-100">الرصيد المتاح للسحب</p>
                    <p className="mt-1 text-3xl font-black tabular-nums">{formatCurrency(stats?.availableBalance || 0)}</p>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 mb-4">
                    <p className="text-sm font-semibold text-amber-700">قيد الانتظار</p>
                    <p className="text-lg font-extrabold tabular-nums text-amber-900">{formatCurrency(stats?.pendingBalance || 0)}</p>
                  </div>
                  <Link href="/creator/payouts" className="block">
                    <Button variant="outline" className="w-full">سحب الأرباح</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* ── Top products ranked ─────────────────────── */}
              <Card className="xl:col-span-3">
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-extrabold text-[var(--ink)]">الأكثر مبيعًا</h3>
                      <p className="text-xs text-gray-500 mt-0.5">منتجاتك الأعلى أداءً</p>
                    </div>
                    <Link href="/creator/products" className="text-sm font-bold text-[var(--primary-strong)] hover:underline">كل المنتجات</Link>
                  </div>
                  {topProducts.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-sm text-gray-500 mb-4">لا توجد منتجات بعد — أنشئ منتجك الأول وابدأ البيع</p>
                      <Link href="/creator/products/new"><Button size="sm">إضافة منتج</Button></Link>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {topProducts.slice(0, 5).map((p, i) => (
                        <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-gray-100 hover:border-[var(--a-400)] p-3 transition-colors">
                          <span className="ghost-ink text-2xl font-black tabular-nums select-none w-8 text-center shrink-0" dir="ltr" aria-hidden="true">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary-strong)] flex items-center justify-center flex-shrink-0">
                            <Icon name="products" className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{p.title}</p>
                            <p className="text-xs text-gray-500 tabular-nums">{p.downloadCount || 0} تحميل · {p.rating?.toFixed(1) || '0.0'} ★</p>
                          </div>
                          <span className="text-sm font-extrabold tabular-nums text-gray-900">{formatCurrency(p.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Recent orders ─────────────────────────────── */}
            <Card>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-[var(--ink)]">الطلبات الأخيرة</h3>
                    <p className="text-xs text-gray-500 mt-0.5">أحدث عمليات الشراء في متجرك</p>
                  </div>
                  <Link href="/creator/orders" className="text-sm font-bold text-[var(--primary-strong)] hover:underline">عرض الكل</Link>
                </div>
                {recentOrders.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">لا توجد طلبات بعد</p>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <table className="w-full min-w-[560px]">
                      <thead>
                        <tr className="text-right text-xs text-gray-400 border-b border-gray-100">
                          <th className="pb-3 font-semibold">العميل</th>
                          <th className="pb-3 font-semibold">المنتج</th>
                          <th className="pb-3 font-semibold">المبلغ</th>
                          <th className="pb-3 font-semibold">الحالة</th>
                          <th className="pb-3 font-semibold">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                            <td className="py-3 text-sm font-semibold text-gray-900">{order.buyer?.name || order.buyer?.email}</td>
                            <td className="py-3 text-sm text-gray-600 max-w-[220px] truncate">{order.items?.[0]?.product?.title || '-'}</td>
                            <td className="py-3 text-sm font-extrabold tabular-nums text-gray-900">{formatCurrency(order.grossAmount)}</td>
                            <td className="py-3">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${order.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {order.status === 'PAID' ? 'مدفوع' : order.status}
                              </span>
                            </td>
                            <td className="py-3 text-sm tabular-nums text-gray-500">{new Date(order.createdAt).toLocaleDateString('ar-DZ-u-nu-latn')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
