'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/layout/admin-sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import FinanceChart, { type FlowMonth } from '@/components/admin/finance-chart'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface DashboardStats {
  totalGMV: number
  platformRevenue: number
  totalCreators: number
  activeCreators: number
  totalBuyers: number
  totalOrders: number
  totalProducts: number
  totalDownloads: number
  conversionRate: number
  gmvDelta: number
  ordersDelta: number
  pendingProducts: number
  pendingReports: number
  pendingComplaints: number
  pendingPayouts: number
  pendingAlerts: number
}

async function getDashboardStats(): Promise<DashboardStats | null> {
  const res = await fetch('/api/admin/dashboard')
  const d = await res.json()
  return (d.data as DashboardStats | null) ?? null
}

const ICONS: Record<string, string> = {
  gmv: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
  revenue: 'M4 19V5m4 14V9m4 10v-7m4 7V6m4 7v6',
  creators: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  orders: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  buyers: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  products: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  downloads: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  conversion: 'M13 10V3L4 14h7v7l9-11h-7z',
  alert: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
  users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  tags: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
  chat: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  cash: 'M3 10h18M7 15h3m-5 4h12a2 2 0 002-2V8a2 2 0 00-2-2H7a2 2 0 00-2 2v9zm0 0H4a2 2 0 00-2 2v1h20v-1a2 2 0 00-2-2h-1',
  vault: 'M3 8h18v3H3zM5 8V6a2 2 0 012-2h10a2 2 0 012 2v2m-9 5h4m-6 5h8a2 2 0 002-2v-4H5v4a2 2 0 002 2z',
  grid: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
}

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[name] ?? ICONS.grid} />
    </svg>
  )
}

function KpiCard({ icon, label, value, sub, tone }: { icon: string; label: string; value: string; sub?: string; tone: 'blue' | 'emerald' | 'amber' | 'violet' }) {
  const tones = {
    blue: 'bg-[var(--primary-soft)] text-[var(--primary-strong)]',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
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

function DeltaChip({ value, dark }: { value: number; dark?: boolean }) {
  const up = value >= 0
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black tabular-nums ${
      up
        ? dark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
        : dark ? 'bg-rose-400/15 text-rose-300' : 'bg-rose-100 text-rose-600'
    }`}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={up ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
      </svg>
      {up ? '+' : ''}{value.toFixed(1)}%
    </span>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [flow, setFlow] = useState<FlowMonth[]>([])
  const [canSeeTreasury, setCanSeeTreasury] = useState(false)

  useEffect(() => {
    let cancelled = false
    getDashboardStats()
      .then((d) => {
        if (cancelled) return
        setStats(d)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d?.data) return
        const role = String(d.data.role || '')
        const allowed = role === 'SUPER_ADMIN' || role === 'ADMIN'
        setCanSeeTreasury(allowed)
        if (!allowed) return
        fetch('/api/admin/treasury?page=1&pageSize=1')
          .then((r) => r.json())
          .then((t) => {
            if (!cancelled && t?.success) setFlow(t.data.monthly as FlowMonth[])
          })
          .catch(() => {})
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const attention = [
    { title: 'منتجات بانتظار المراجعة', count: stats?.pendingProducts || 0, href: '/admin/products?status=PENDING_REVIEW', tone: 'amber' as const, icon: 'products' },
    { title: 'بلاغات تحتاج معالجة', count: stats?.pendingReports || 0, href: '/admin/reports', tone: 'red' as const, icon: 'alert' },
    { title: 'شكاوى مفتوحة', count: stats?.pendingComplaints || 0, href: '/admin/complaints', tone: 'blue' as const, icon: 'chat' },
    { title: 'طلبات سحب معلقة', count: stats?.pendingPayouts || 0, href: '/admin/payouts', tone: 'emerald' as const, icon: 'cash' },
    { title: 'تنبيهات نظام غير مقروءة', count: stats?.pendingAlerts || 0, href: '/admin/alerts', tone: 'red' as const, icon: 'alert' },
  ]
  const maxAttention = Math.max(1, ...attention.map((a) => a.count))

  const shortcuts = [
    { title: 'المستخدمون', desc: 'إدارة الحسابات والأدوار', href: '/admin/users', icon: 'users' },
    { title: 'المنتجات', desc: 'مراجعة واعتماد المنتجات', href: '/admin/products', icon: 'products' },
    { title: 'الطلبات', desc: 'تتبع عمليات الشراء', href: '/admin/orders', icon: 'orders' },
    { title: 'الخزينة', desc: 'الأرصدة والتدفق المالي', href: '/admin/treasury', icon: 'vault' },
    { title: 'الفئات', desc: 'تنظيم أقسام السوق', href: '/admin/categories', icon: 'grid' },
    { title: 'الكوبونات', desc: 'الخصومات والعروض', href: '/admin/coupons', icon: 'tags' },
    { title: 'المبدعون', desc: 'حسابات البائعين', href: '/admin/creators', icon: 'creators' },
    { title: 'التقارير', desc: 'البلاغات والمراجعة', href: '/admin/reports', icon: 'alert' },
    { title: 'الإعدادات', desc: 'إعدادات المنصة', href: '/admin/settings', icon: 'settings' },
  ]

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="لوحة تحكم الإدارة" subtitle={loading ? 'جاري التحميل...' : 'نظرة عامة على المنصة'} />

        {/* ── Hero summary band ─────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-[#0b1026] text-white p-6 sm:p-8 mb-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(40rem 20rem at 95% -20%, rgba(59,109,246,0.4) 0%, transparent 55%), radial-gradient(30rem 18rem at 0% 120%, rgba(251,191,36,0.16) 0%, transparent 55%)',
            }}
          />
          <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
            <div>
              <p className="overline-label text-[11px] text-amber-300/90">R2 · COMMAND CENTER</p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black display-tight flex items-center gap-3 flex-wrap">
                {loading ? '...' : `${formatCurrency(stats?.totalGMV || 0)} إجمالي المبيعات`}
                {!loading && <DeltaChip value={stats?.gmvDelta || 0} dark />}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                إيرادات المنصة {loading ? '...' : formatCurrency(stats?.platformRevenue || 0)}
                <span className="mx-2 text-white/20">·</span>
                {loading ? '...' : `${stats?.totalOrders || 0} طلب`} {!loading && <DeltaChip value={stats?.ordersDelta || 0} dark />}
                <span className="mx-2 text-white/20">·</span>
                {loading ? '...' : `${stats?.totalProducts || 0} منتج`}
              </p>
              <p className="mt-1 text-[11px] text-white/40">النسبة مقارنة بالـ30 يومًا السابقة</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {canSeeTreasury && (
                <Link href="/admin/treasury" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-amber-400 text-[#0b1026] shadow-[0_10px_24px_-10px_rgba(251,191,36,0.8)] hover:brightness-110 transition-all">
                  <Icon name="vault" className="w-4 h-4" />
                  الخزينة
                </Link>
              )}
              <Link href="/admin/products?status=PENDING_REVIEW" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold brand-gradient text-white shadow-[0_10px_24px_-10px_rgba(37,78,219,0.7)] hover:brightness-110 transition-all">
                <Icon name="check" className="w-4 h-4" />
                مراجعة المنتجات
                {(stats?.pendingProducts || 0) > 0 && (
                  <span className="min-w-5 h-5 px-1 rounded-full bg-white/25 text-xs font-black tabular-nums flex items-center justify-center">{stats?.pendingProducts}</span>
                )}
              </Link>
              <Link href="/admin/users" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-colors">
                <Icon name="users" className="w-4 h-4" />
                المستخدمون
              </Link>
            </div>
          </div>
        </section>

        {loading && !stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* ── KPI cards ─────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard icon="gmv" label="إجمالي المبيعات" value={formatCurrency(stats?.totalGMV || 0)} sub={`${stats?.totalOrders || 0} طلب`} tone="blue" />
              <KpiCard icon="revenue" label="إيرادات المنصة" value={formatCurrency(stats?.platformRevenue || 0)} sub={`تحويل ${(stats?.conversionRate || 0).toFixed(1)}%`} tone="emerald" />
              <KpiCard icon="creators" label="المبدعون" value={String(stats?.totalCreators || 0)} sub={`نشط: ${stats?.activeCreators || 0}`} tone="violet" />
              <KpiCard icon="buyers" label="المشترون" value={String(stats?.totalBuyers || 0)} sub={`${stats?.totalDownloads || 0} تحميل`} tone="amber" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              {/* ── Attention queue ─────────────────────────── */}
              <Card className="xl:col-span-3">
                <CardContent>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-extrabold text-[var(--ink)]">تحتاج انتباهك</h3>
                      <p className="text-xs text-gray-500 mt-0.5">عناصر معلقة مرتبة حسب الأولوية</p>
                    </div>
                    <span className={`text-xs font-black tabular-nums px-2.5 py-1 rounded-full ${(attention.reduce((s, a) => s + a.count, 0)) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {attention.reduce((s, a) => s + a.count, 0) === 0 ? 'كل شيء مُنجز' : `${attention.reduce((s, a) => s + a.count, 0)} معلق`}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {attention.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group flex items-center gap-4 rounded-2xl border border-gray-200 p-4 hover:border-[var(--a-400)] hover:shadow-[var(--shadow-sm)] transition-all"
                      >
                        <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                          item.tone === 'amber' ? 'bg-amber-100 text-amber-600'
                          : item.tone === 'red' ? 'bg-red-100 text-red-500'
                          : item.tone === 'blue' ? 'bg-[var(--primary-soft)] text-[var(--primary-strong)]'
                          : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          <Icon name={item.icon} className="w-5 h-5" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-bold text-gray-800">{item.title}</span>
                          <span className="mt-1.5 block h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <span
                              className={`block h-full rounded-full transition-all ${
                                item.tone === 'amber' ? 'bg-amber-500'
                                : item.tone === 'red' ? 'bg-red-500'
                                : item.tone === 'blue' ? 'bg-[var(--a-600)]'
                                : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.round((item.count / maxAttention) * 100))}%` }}
                            />
                          </span>
                        </span>
                        <span className="text-2xl font-black tabular-nums text-gray-900">{item.count}</span>
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-[var(--primary-strong)] rtl:rotate-180 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ── Management shortcuts ────────────────────── */}
              <Card className="xl:col-span-2">
                <CardContent>
                  <h3 className="font-extrabold text-[var(--ink)] mb-1">إدارة سريعة</h3>
                  <p className="text-xs text-gray-500 mb-4">انتقال مباشر لأقسام الإدارة</p>
                  <div className="grid grid-cols-2 gap-3">
                    {shortcuts.filter((s) => s.href !== '/admin/treasury' || canSeeTreasury).map((s) => (
                      <Link
                        key={s.href}
                        href={s.href}
                        className="group rounded-2xl border border-gray-200 p-4 hover:border-[var(--a-400)] hover:bg-[var(--primary-soft)]/40 transition-all"
                      >
                        <span className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary-strong)] flex items-center justify-center mb-2.5 group-hover:bg-[var(--a-600)] group-hover:text-white transition-all">
                          <Icon name={s.icon} className="w-[18px] h-[18px]" />
                        </span>
                        <span className="block text-sm font-extrabold text-gray-800">{s.title}</span>
                        <span className="block text-xs text-gray-400 mt-0.5">{s.desc}</span>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Cash flow ─────────────────────────────────── */}
            {!loading && flow.length > 0 && (
              <Card className="mt-6">
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-extrabold text-[var(--ink)]">التدفق المالي</h3>
                      <p className="text-xs text-gray-500 mt-0.5">داخل مقابل خارج — آخر 6 أشهر</p>
                    </div>
                    <Link href="/admin/treasury" className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary-strong)] hover:underline">
                      فتح الخزينة
                      <svg className="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                  <FinanceChart months={flow} height={150} />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}
