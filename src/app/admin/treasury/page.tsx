'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import FinanceChart, { type FlowMonth } from '@/components/admin/finance-chart'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  SALE: 'مبيعات',
  PLATFORM_FEE: 'عمولة المنصة',
  PAYMENT_FEE: 'رسوم الدفع',
  SELLER_EARNING: 'أرباح البائعين',
  REFUND: 'مستردات',
  PAYOUT: 'مسحوبات',
  ADJUSTMENT: 'تسويات يدوية',
}

const TYPE_TONES: Record<string, string> = {
  SALE: 'bg-sky-100 text-sky-700',
  PLATFORM_FEE: 'bg-emerald-100 text-emerald-700',
  PAYMENT_FEE: 'bg-slate-200 text-slate-600',
  SELLER_EARNING: 'bg-violet-100 text-violet-700',
  REFUND: 'bg-amber-100 text-amber-700',
  PAYOUT: 'bg-rose-100 text-rose-700',
  ADJUSTMENT: 'bg-indigo-100 text-indigo-700',
}

interface Tx {
  id: string
  type: string
  amount: number
  currency: string
  description: string | null
  orderId: string | null
  createdAt: string
}

interface TreasuryData {
  byType: { type: string; total: number; count: number }[]
  inflow: number
  outflow: number
  net: number
  pendingPayouts: number
  paidPayouts: number
  monthly: FlowMonth[]
  transactions: Tx[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function VaultCard({ label, value, sub, icon, dark }: { label: string; value: string; sub: string; icon: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border p-5 ${dark ? 'border-white/10 bg-white/[0.06] backdrop-blur' : 'border-gray-200 bg-white shadow-[var(--shadow-sm)]'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs font-semibold ${dark ? 'text-white/60' : 'text-gray-500'}`}>{label}</p>
          <p className={`mt-1.5 text-xl sm:text-2xl font-black tabular-nums truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          <p className={`mt-1 text-xs ${dark ? 'text-white/50' : 'text-gray-400'}`}>{sub}</p>
        </div>
        <span className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${dark ? 'bg-white/10 text-amber-300' : 'bg-amber-50 text-amber-600'}`}>
          {icon}
        </span>
      </div>
    </div>
  )
}

function fetchTreasury(page: number, type: string, q: string, month: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: '20' })
  if (type) params.set('type', type)
  if (q.trim()) params.set('q', q.trim())
  if (month) params.set('month', month)
  return fetch(`/api/admin/treasury?${params.toString()}`).then((r) => r.json())
}

export default function TreasuryPage() {
  const [data, setData] = useState<TreasuryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('')
  const [q, setQ] = useState('')
  const [month, setMonth] = useState('')
  const [page, setPage] = useState(1)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchTreasury(page, type, q, month)
      .then((d) => {
        if (cancelled) return
        if (d?.success) setData(d.data as TreasuryData)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, type, q, month])

  function refreshTreasury() {
    setLoading(true)
    fetchTreasury(page, type, q, month)
      .then((d) => {
        if (d?.success) setData(d.data as TreasuryData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  function pickMonth(key: string | null) {
    setMonth(key || '')
    setPage(1)
  }

  function submitAdjustment(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const value = Number(amount)
    if (!Number.isFinite(value) || value === 0) {
      setFormError('أدخل مبلغًا صحيحًا غير صفري (سالب للخصم)')
      return
    }
    if (!reason.trim()) {
      setFormError('سبب التسوية مطلوب وسيُحفظ في سجل المراجعة')
      return
    }
    setSaving(true)
    fetch('/api/admin/treasury', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: value, description: reason.trim() }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d?.success) {
          setFormError(d?.error || 'تعذر حفظ التسوية')
          return
        }
        setAdjustOpen(false)
        setAmount('')
        setReason('')
        setPage(1)
        refreshTreasury()
      })
      .catch(() => setFormError('تعذر حفظ التسوية'))
      .finally(() => setSaving(false))
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader
          title="الخزينة"
          subtitle="حركة الأموال، الأرصدة، والتسويات اليدوية"
          actions={
            <button
              onClick={() => setAdjustOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold brand-gradient text-white shadow-[0_10px_24px_-10px_rgba(37,78,219,0.7)] hover:brightness-110 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              تسوية يدوية
            </button>
          }
        />

        {/* ── Vault hero ─────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-[#0b1026] text-white p-6 sm:p-8 mb-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(36rem 18rem at 90% -20%, rgba(251,191,36,0.22) 0%, transparent 55%), radial-gradient(30rem 18rem at 5% 120%, rgba(59,109,246,0.35) 0%, transparent 55%)',
            }}
          />
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="overline-label text-[11px] text-amber-300/90">R2 · TREASURY</p>
                <h2 className="mt-2 text-3xl sm:text-4xl font-black tabular-nums display-tight">
                  {loading && !data ? '...' : formatCurrency(data?.net || 0)}
                </h2>
                <p className="mt-1.5 text-sm text-white/60">صافي حركة الخزينة عبر كل السجل</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-white/50 text-xs mb-1">داخل</p>
                  <p className="font-black tabular-nums text-emerald-300">{loading && !data ? '...' : formatCurrency(data?.inflow || 0)}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1">خارج</p>
                  <p className="font-black tabular-nums text-rose-300">{loading && !data ? '...' : formatCurrency(data?.outflow || 0)}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <VaultCard
                dark
                label="التزامات معلقة (مسحوبات)"
                value={loading && !data ? '...' : formatCurrency(data?.pendingPayouts || 0)}
                sub="مستحقة للمبدعين"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <VaultCard
                dark
                label="مسحوبات مدفوعة"
                value={loading && !data ? '...' : formatCurrency(data?.paidPayouts || 0)}
                sub="إجمالي ما خرج للبائعين"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <VaultCard
                dark
                label="معاملات السجل"
                value={loading && !data ? '...' : String(data?.total || 0)}
                sub={`${(data?.byType.length || 0)} أنواع حركات`}
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" /></svg>}
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6">
          {/* ── Monthly flow chart ───────────────────────── */}
          <Card className="xl:col-span-3">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-[var(--ink)]">التدفق الشهري</h3>
                  <p className="text-xs text-gray-500 mt-0.5">آخر 6 أشهر — داخل مقابل خارج</p>
                </div>
              </div>
              {loading && !data ? (
                <div className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
              ) : (
                <FinanceChart months={data?.monthly || []} currency={formatCurrency} selectedKey={month || null} onSelect={pickMonth} />
              )}
            </CardContent>
          </Card>

          {/* ── Breakdown by type ────────────────────────── */}
          <Card className="xl:col-span-2">
            <CardContent>
              <h3 className="font-extrabold text-[var(--ink)] mb-1">التوزيع حسب النوع</h3>
              <p className="text-xs text-gray-500 mb-4">إجمالي كل نوع عبر كامل السجل</p>
              <div className="space-y-2.5">
                {(data?.byType || []).map((t) => (
                  <button
                    key={t.type}
                    onClick={() => { setType(t.type); setPage(1) }}
                    className={`w-full flex items-center gap-3 rounded-2xl border p-3 text-right transition-all hover:shadow-[var(--shadow-sm)] ${type === t.type ? 'border-[var(--a-400)] bg-[var(--primary-soft)]/40' : 'border-gray-200'}`}
                  >
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-black ${TYPE_TONES[t.type] || 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[t.type] || t.type}
                    </span>
                    <span className="flex-1 text-xs text-gray-400 tabular-nums">{t.count} حركة</span>
                    <span className={`text-sm font-black tabular-nums ${t.total >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.total >= 0 ? '+' : ''}{formatCurrency(t.total)}
                    </span>
                  </button>
                ))}
                {(!data?.byType.length && !loading) && <p className="text-sm text-gray-400">لا حركات بعد.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Ledger ─────────────────────────────────────── */}
        <Card>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div>
                <h3 className="font-extrabold text-[var(--ink)]">دفتر الحركات</h3>
                <p className="text-xs text-gray-500 mt-0.5">كل قيود الخزينة مع بحث وفلترة</p>
              </div>
              <div className="sm:mr-auto flex flex-col sm:flex-row gap-2">
                {month && (
                  <button
                    onClick={() => pickMonth(null)}
                    className="h-10 px-3 rounded-xl bg-[var(--primary-soft)] text-[var(--primary-strong)] text-sm font-bold inline-flex items-center gap-1.5 hover:brightness-95"
                  >
                    شهر {month}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
                <select
                  value={type}
                  onChange={(e) => { setType(e.target.value); setPage(1) }}
                  className="h-10 px-3 rounded-xl border border-gray-300 bg-white text-sm text-gray-700"
                >
                  <option value="">كل الأنواع</option>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); refreshTreasury() } }}
                  placeholder="بحث برقم الطلب أو الوصف..."
                  className="h-10 px-3 rounded-xl border border-gray-300 bg-white text-sm w-full sm:w-64"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">{[0, 1, 2, 3].map((i) => (<div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />))}</div>
            ) : (
              <>
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="text-right text-xs text-gray-400 border-b border-gray-100">
                        <th className="py-2.5 px-2 font-semibold">النوع</th>
                        <th className="py-2.5 px-2 font-semibold">المبلغ</th>
                        <th className="py-2.5 px-2 font-semibold">البيان</th>
                        <th className="py-2.5 px-2 font-semibold">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.transactions || []).map((t) => (
                        <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                          <td className="py-3 px-2">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black ${TYPE_TONES[t.type] || 'bg-gray-100 text-gray-600'}`}>
                              {TYPE_LABELS[t.type] || t.type}
                            </span>
                          </td>
                          <td className={`py-3 px-2 font-black tabular-nums ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.amount >= 0 ? '+' : ''}{formatCurrency(t.amount)}
                          </td>
                          <td className="py-3 px-2 text-gray-600 max-w-[280px] truncate" title={t.description || t.orderId || ''}>
                            {t.description || t.orderId || '—'}
                          </td>
                          <td className="py-3 px-2 text-gray-400 text-xs tabular-nums whitespace-nowrap">
                            {new Date(t.createdAt).toLocaleString('ar-DZ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(data?.transactions.length === 0) && <p className="py-8 text-center text-sm text-gray-400">لا نتائج مطابقة.</p>}
                </div>
                {(data?.totalPages || 0) > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-4 h-9 rounded-full text-sm font-bold border border-gray-300 disabled:opacity-40 hover:border-[var(--a-400)]"
                    >
                      السابق
                    </button>
                    <span className="text-xs text-gray-500 tabular-nums">{page} / {data?.totalPages}</span>
                    <button
                      disabled={page >= (data?.totalPages || 1)}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-4 h-9 rounded-full text-sm font-bold border border-gray-300 disabled:opacity-40 hover:border-[var(--a-400)]"
                    >
                      التالي
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* ── Adjustment dialog ────────────────────────────── */}
      {adjustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !saving && setAdjustOpen(false)} />
          <form onSubmit={submitAdjustment} className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="font-black text-lg text-[var(--ink)]">تسوية يدوية</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">تُسجل في الدفتر وتظهر في سجل المراجعة باسمك. المبلغ السالب خصم.</p>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">المبلغ (دج)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="مثال: 5000 أو -2000"
              inputMode="decimal"
              className="w-full h-11 px-3 rounded-xl border border-gray-300 text-sm tabular-nums mb-3"
            />
            <label className="block text-sm font-bold text-gray-700 mb-1.5">السبب</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: تصحيح رصيد بعد مراجعة..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm mb-3"
            />
            {formError && <p className="text-sm text-red-600 mb-3">{formError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setAdjustOpen(false)}
                className="flex-1 h-11 rounded-xl border border-gray-300 text-sm font-bold text-gray-600"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-11 rounded-xl brand-gradient text-white text-sm font-bold disabled:opacity-50"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ التسوية'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
