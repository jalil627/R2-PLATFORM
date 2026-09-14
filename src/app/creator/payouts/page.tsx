'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Link from 'next/link'
import Button from '@/components/ui/button'
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

const STATUS: Record<string, { label: string; variant: 'default' | 'warning' | 'info' | 'success' | 'danger'; hint: string }> = {
  REQUESTED: { label: 'قيد المراجعة', variant: 'warning', hint: 'استلمنا طلبك وسيراجعه فريق المنصة قريبًا.' },
  PENDING: { label: 'مقبول — بانتظار التحويل', variant: 'info', hint: 'تم قبول طلبك، التحويل البنكي سيتم خلال 1-3 أيام عمل.' },
  PROCESSING: { label: 'التحويل جارٍ', variant: 'info', hint: 'ننفذ التحويل إلى حسابك البنكي الآن.' },
  PAID: { label: 'تم الدفع', variant: 'success', hint: 'وصل المبلغ إلى حسابك. تحقق من كشف حسابك.' },
  FAILED: { label: 'فشل التحويل', variant: 'danger', hint: 'تعذر التحويل — أُعيد المبلغ إلى رصيدك. راجع بيانات حسابك واطلب مجددًا.' },
  CANCELLED: { label: 'ملغي', variant: 'default', hint: 'أُلغي الطلب وأُعيد المبلغ إلى رصيدك المتاح.' },
}

interface Payout {
  id: string
  amount: number
  status: string
  providerPayoutId?: string | null
  notes?: string | null
  details?: { method?: string; holderName?: string; account?: string; key?: string } | null
  createdAt: string
}

const METHOD_LABELS: Record<string, string> = {
  ccp: 'CCP / بريدي جاري',
  rip: 'تحويل بنكي (RIP)',
  baridimob: 'بريدي موب',
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [available, setAvailable] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/creator/payouts')
      .then(r => r.json())
      .then(d => {
        if (d?.success) {
          setPayouts(d.data.payouts as Payout[])
          setAvailable(d.data.balances?.available || 0)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={creatorLinks} title="لوحة التحكم" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader
          title="المدفوعات"
          subtitle="طلبات السحب إلى حسابك البنكي"
          actions={
            <Link href="/creator/earnings">
              <Button>طلب سحب جديد</Button>
            </Link>
          }
        />

        <Card className="mb-6">
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <p className="text-sm text-gray-500">رصيدك المتاح للسحب</p>
                <p className="text-2xl font-black tabular-nums text-emerald-600">{formatCurrency(available)}</p>
              </div>
              <p className="text-xs text-gray-400 max-w-sm">تُحوَّل الأرباح للرصيد المتاح بعد مهلة المراجعة، ثم تطلب السحب برقم حسابك فيصلُك المبلغ بتحويل حقيقي.</p>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card><CardContent><div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div></CardContent></Card>
        ) : payouts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد عمليات سحب بعد</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">اطلب سحب أرباحك من صفحة الأرباح وستُحوَّل إلى حسابك البنكي.</p>
              <Link href="/creator/earnings">
                <Button variant="outline">الانتقال إلى الأرباح</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {payouts.map((p) => {
              const s = STATUS[p.status] || { label: p.status, variant: 'default' as const, hint: '' }
              return (
                <Card key={p.id}>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black tabular-nums text-gray-900">{formatCurrency(p.amount)}</p>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {p.details?.method ? `${METHOD_LABELS[p.details.method] || p.details.method} · ` : ''}
                          {p.details?.holderName || ''} · {new Date(p.createdAt).toLocaleString('ar-DZ')}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{s.hint}</p>
                        {p.providerPayoutId && <p className="text-xs text-gray-400 mt-1 font-mono" dir="ltr">Ref: {p.providerPayoutId}</p>}
                      </div>
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
