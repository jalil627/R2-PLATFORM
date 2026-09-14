'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
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

interface EarningsSummary {
  totalEarnings?: number
  pendingBalance?: number
  availableBalance?: number
}

interface EarningsOrder {
  id: string
  orderNumber?: string | null
  status: string
  sellerEarnings?: number | null
  createdAt: string
  buyer?: { name?: string | null; email?: string | null } | null
}

const METHOD_LABELS: Record<string, string> = {
  ccp: 'CCP / بريدي جاري',
  rip: 'تحويل بنكي (RIP)',
  baridimob: 'بريدي موب (BaridiMob)',
}

export default function EarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary>({})
  const [orders, setOrders] = useState<EarningsOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [method, setMethod] = useState('ccp')
  const [amount, setAmount] = useState('')
  const [holderName, setHolderName] = useState('')
  const [account, setAccount] = useState('')
  const [ccpKey, setCcpKey] = useState('')
  const [minAmount, setMinAmount] = useState(1000)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/creator/dashboard').then(r => r.json()),
      fetch('/api/orders?role=seller').then(r => r.json()),
      fetch('/api/creator/payouts').then(r => r.json()).catch(() => null),
    ]).then(([d, o, p]) => {
      setSummary(d?.data?.stats || {})
      setOrders((o?.data || []).filter((x: EarningsOrder) => x.status === 'PAID'))
      if (p?.success && p?.data?.config?.minAmount) setMinAmount(p.data.config.minAmount)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function submitWithdraw(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    setSubmitting(true)
    fetch('/api/creator/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(amount),
        method,
        holderName: holderName.trim(),
        account: account.trim(),
        key: method === 'ccp' ? ccpKey.trim() : undefined,
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (d?.success) {
          setResult({ ok: true, msg: 'تم إرسال طلب السحب بنجاح — سيراجعه فريق المنصة ويحوّل المبلغ إلى حسابك.' })
          setAmount('')
          setAccount('')
          setCcpKey('')
          fetch('/api/creator/dashboard').then(r => r.json()).then(dd => setSummary(dd?.data?.stats || {})).catch(() => {})
        } else {
          setResult({ ok: false, msg: d?.error || 'تعذر إرسال الطلب' })
        }
      })
      .catch(() => setResult({ ok: false, msg: 'خطأ في الاتصال' }))
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={creatorLinks} title="لوحة التحكم" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="الأرباح" subtitle="تتبع أرباحك وإدارة السحب" actions={
          <Button onClick={() => { setShowWithdraw(!showWithdraw); setResult(null) }}>{showWithdraw ? 'إخفاء' : 'سحب الأرباح'}</Button>
        } />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card><CardContent>
            <p className="text-sm text-gray-500 mb-1">إجمالي الأرباح</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalEarnings || 0)}</p>
          </CardContent></Card>
          <Card><CardContent>
            <p className="text-sm text-gray-500 mb-1">المعلق</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.pendingBalance || 0)}</p>
          </CardContent></Card>
          <Card><CardContent>
            <p className="text-sm text-gray-500 mb-1">المتاح للسحب</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.availableBalance || 0)}</p>
          </CardContent></Card>
        </div>

        {showWithdraw && (
          <Card className="mb-6">
            <CardContent>
              <h3 className="font-semibold text-gray-900 mb-1">طلب سحب الأرباح</h3>
              <p className="text-xs text-gray-500 mb-4">
                الحد الأدنى {formatCurrency(minAmount)} — يُحوَّل المبلغ إلى حسابك البنكي بعد مراجعة الإدارة (عادة خلال 1-3 أيام عمل).
              </p>
              <form className="space-y-4 max-w-md" onSubmit={submitWithdraw}>
                <Input
                  type="number"
                  label={`المبلغ المطلوب (دج) — المتاح: ${formatCurrency(summary.availableBalance || 0)}`}
                  min={minAmount}
                  max={summary.availableBalance || 0}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="أدخل المبلغ"
                  required
                />
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">طريقة الاستلام</p>
                  <div className="space-y-2">
                    {Object.entries(METHOD_LABELS).map(([value, label]) => (
                      <label key={value} className={`flex items-center gap-2 text-sm cursor-pointer p-3 rounded-lg border transition-colors ${method === value ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300'}`}>
                        <input type="radio" name="method" value={value} checked={method === value} onChange={e => setMethod(e.target.value)} className="text-blue-700" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <Input label="اسم صاحب الحساب" value={holderName} onChange={e => setHolderName(e.target.value)} placeholder="الاسم الكامل كما في الحساب" required minLength={3} maxLength={100} />
                {method === 'ccp' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="رقم حساب CCP" value={account} onChange={e => setAccount(e.target.value)} placeholder="مثال: 12345678" required inputMode="numeric" />
                    <Input label="المفتاح (Clé)" value={ccpKey} onChange={e => setCcpKey(e.target.value)} placeholder="مثال: 90" required inputMode="numeric" />
                  </div>
                )}
                {method === 'rip' && (
                  <Input label="رقم RIP البنكي (20 رقمًا)" value={account} onChange={e => setAccount(e.target.value)} placeholder="مثال: 0079999900XXXXXXXXXX" required inputMode="numeric" dir="ltr" />
                )}
                {method === 'baridimob' && (
                  <Input label="رقم الهاتف المرتبط ببريدي موب" value={account} onChange={e => setAccount(e.target.value)} placeholder="مثال: 0550123456" required inputMode="tel" dir="ltr" />
                )}
                <Button type="submit" loading={submitting}>تأكيد طلب السحب</Button>
                {result && <p className={`text-sm ${result.ok ? 'text-emerald-600' : 'text-red-600'}`}>{result.msg}</p>}
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          {loading ? (
            <CardContent><div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div></CardContent>
          ) : orders.length === 0 ? (
            <CardContent><p className="text-center text-gray-500 py-12">لا توجد معاملات بعد — ستظهر هنا أرباحك من أول عملية بيع.</p></CardContent>
          ) : (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
                      <th className="px-4 py-3 font-medium">رقم الطلب</th>
                      <th className="px-4 py-3 font-medium">العميل</th>
                      <th className="px-4 py-3 font-medium">النوع</th>
                      <th className="px-4 py-3 font-medium">المبلغ</th>
                      <th className="px-4 py-3 font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.buyer?.name || order.buyer?.email}</td>
                        <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">بيع</span></td>
                        <td className="px-4 py-3 text-sm font-medium text-emerald-600">+{formatCurrency(order.sellerEarnings || 0)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('ar')}</td>
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