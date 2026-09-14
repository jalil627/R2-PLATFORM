'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  { label: 'الخطة والاشتراك', href: '/creator/plans', icon: 'subscriptions' },
  { label: 'المدفوعات', href: '/creator/payouts', icon: 'payouts' },
  { label: 'إعدادات المتجر', href: '/creator/settings', icon: 'settings' },
]

const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'قيد الانتظار', cls: 'bg-amber-100 text-amber-700' },
  PAID: { label: 'مفعّل', cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'مرفوض', cls: 'bg-red-100 text-red-700' },
}

const proFeatures = [
  'منتجات غير محدودة',
  'كوبونات خصم',
  'إحصائيات متقدمة',
  'تسويق بالعمولة وروابط دعوة',
  'تمييز منتجاتك (ظهور أوضح)',
  'دعم أولوية',
]

interface PlanPurchase {
  id: string
  amount: number
  status: string
  createdAt: string
}

interface CreatorPlanData {
  isPro?: boolean
  daysLeft?: number
  freeMaxProducts?: number
  memberNo?: string | number | null
  purchases?: PlanPurchase[] | null
  promoActive?: boolean
  promoPercent?: number
  promoScope?: string
  promoEndsAt?: string | null
  hasPurchasedBefore?: boolean
  firstDiscount?: number
  firstPrice?: number
  firstOriginalPrice?: number
  renewDiscount?: number
  renewPrice?: number
  renewOriginalPrice?: number
}

export default function CreatorPlansPage() {
  const [data, setData] = useState<CreatorPlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reference, setReference] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/creator/plans')
      .then(r => r.json())
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function purchase() {
    setSubmitting(true)
    setMessage('')
    try {
      const res = await fetch('/api/creator/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'PRO', reference, paymentMethod: 'BANK_TRANSFER' }),
      })
      const d = await res.json()
      if (d.success) {
        setMessage(d.message)
        setReference('')
        const rr = await fetch('/api/creator/plans')
        const dd = await rr.json()
        setData(dd.data)
      } else {
        setMessage(d.error || 'حدث خطأ ما')
      }
    } catch (e) {
      console.error(e)
      setMessage('خطأ في الاتصال')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
        <Sidebar links={creatorLinks} title="لوحة التحكم" />
        <main className="flex-1 p-6">
          <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        </main>
      </div>
    )
  }

  const isPro = data?.isPro
  const remaining = data?.daysLeft ?? -1

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={creatorLinks} title="لوحة التحكم" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="الخطة والاشتراك" subtitle="استمتع بكل مميزات المنصة" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            {isPro ? (
              <div className="relative overflow-hidden rounded-2xl brand-gradient text-white p-8">
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold">PRO</span>
                    <span className="text-xs text-blue-100">اشتراك نشط</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">خطة برو مفعّلة</h2>
                  <p className="text-blue-100 mb-6">
                    {remaining >= 0 ? `تبقى ${remaining} يومًا على انتهاء الاشتراك` : 'اشتراك مستمر'}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
                    {proFeatures.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                        <svg className="w-5 h-5 text-blue-200 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">أنت على الخطة المجانية</h2>
                <p className="text-gray-500 mb-6">
                  يمكنك إضافة حتى {data?.freeMaxProducts ?? 5} منتجات. رقِّ إلى برو للاستفادة من كل المميزات.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['إضافة المنتجات', 'سوق مشترك'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">رقم العضو</p>
                <p className="text-2xl font-bold text-gray-900 font-mono">#{data?.memberNo ?? '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">سجل الاشتراكات</p>
                {data?.purchases?.length ? (
                  <ul className="space-y-2 mt-2">
                    {data.purchases.slice(0, 5).map((p: PlanPurchase) => (
                      <li key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {formatCurrency(p.amount)} — {new Date(p.createdAt).toLocaleDateString('ar-DZ-u-nu-latn')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusMap[p.status]?.cls || ''}`}>
                          {statusMap[p.status]?.label || p.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 mt-2">لا توجد اشتراكات بعد</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-4">اشترِ أو جدّد خطة برو</h3>
        {data?.promoActive && (
          <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-gray-700">
            عرض من الإدارة: خصم {data.promoPercent}% على {data.promoScope === 'FIRST' ? 'أول اشتراك' : data.promoScope === 'RENEW' ? 'التجديدات' : 'جميع الاشتراكات'}{data.promoEndsAt ? ` حتى ${new Date(data.promoEndsAt).toLocaleDateString('ar-DZ-u-nu-latn')}` : ''}.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`rounded-2xl p-6 border ${!data?.hasPurchasedBefore ? 'brand-gradient text-white ring-2 ring-blue-400/50' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold">الشهر الأول</h4>
              {(data?.firstDiscount || 0) > 0 && (
                <span className="px-2 py-1 rounded-full bg-blue-600/90 text-white text-xs font-bold">خصم {data?.firstDiscount}%</span>
              )}
              {!data?.hasPurchasedBefore && <span className="px-2 py-1 rounded-full bg-white/20 text-xs font-bold">الأفضل للبدء</span>}
            </div>
            <div className="mb-4">
              {(data?.firstDiscount || 0) > 0 && (
                <span className="block text-sm text-gray-400 line-through">{formatCurrency(data?.firstOriginalPrice ?? 300)} دج</span>
              )}
              <span className="text-3xl font-bold">{formatCurrency(data?.firstPrice ?? 300)}</span>
              <span className="text-sm opacity-80"> دج / شهر</span>
            </div>
            <p className="text-sm opacity-90 mb-4">كامل المميزات لمدة شهر كامل وبسعر البداية المخفّض. جرب برو بأقل تكلفة.</p>
          </div>

          <div className={`rounded-2xl p-6 border ${data?.hasPurchasedBefore ? 'brand-gradient text-white ring-2 ring-blue-400/50' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold">التجديد الشهري</h4>
              {(data?.renewDiscount || 0) > 0 && (
                <span className="px-2 py-1 rounded-full bg-blue-600/90 text-white text-xs font-bold">خصم {data?.renewDiscount}%</span>
              )}
              <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">السعر الحالي</span>
            </div>
            <div className="mb-4">
              {(data?.renewDiscount || 0) > 0 && (
                <span className="block text-sm text-gray-400 line-through">{formatCurrency(data?.renewOriginalPrice ?? 1000)} دج</span>
              )}
              <span className="text-3xl font-bold">{formatCurrency(data?.renewPrice ?? 1000)}</span>
              <span className="text-sm opacity-80"> دج / شهر</span>
            </div>
            <p className="text-sm opacity-90 mb-4">استمرار كامل المميزات: منتجات غير محدودة، كوبونات، إحصائيات متقدمة، وعمولة.</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <h4 className="font-bold text-gray-900 mb-2">طريقة الدفع (تحويل بنكي)</h4>
            <div className="text-sm text-gray-600 space-y-1 mb-4 rounded-lg bg-gray-50 p-4">
              <p>1. حوّل مبلغ الاشتراك إلى حساب المنصة: <strong>CCP 12345678 — Clé 90</strong> (الاسم: R2 Platform).</p>
              <p>2. احتفظ برقم العملية / رقم التحويل.</p>
              <p>3. أرسل رقم العملية بالأسفل وسيتم تفعيل الخطة فور تأكيد الإدارة (خلال 24 ساعة).</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="رقم التحويل / العملية"
                className="flex-1"
              />
              <Button onClick={purchase} loading={submitting} disabled={!reference.trim()}>
                تسجيل طلب الاشتراك
              </Button>
            </div>
            {message && <p className="mt-3 text-sm text-blue-700">{message}</p>}
            <p className="mt-4 text-xs text-gray-400">
              ملاحظة: سعر الشهر الأول {formatCurrency(data?.firstPrice ?? 300)} دج، وبعده {formatCurrency(data?.renewPrice ?? 1000)} دج شهريًا، مع بقاء {formatCurrency((data?.renewPrice ?? 1000) - (data?.firstPrice ?? 300))} دج كاملة لمدة شهر كامل من كل تجديد.
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/pricing" className="text-sm text-blue-700 hover:underline">عرض تفاصيل الخطط على صفحة الأسعار</Link>
        </div>
      </main>
    </div>
  )
}