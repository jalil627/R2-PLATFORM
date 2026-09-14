'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

type FormState = Record<string, string>

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<FormState>({})

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const s: FormState = {}
          for (const [k, v] of Object.entries(d.data)) s[k] = String(v)
          setForm(s)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (d.success) {
        const s: FormState = {}
        for (const [k, v] of Object.entries(d.data)) s[k] = String(v)
        setForm(s)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        alert(d.error || 'فشل الحفظ')
      }
    } catch (e) { console.error(e); alert('خطأ في الاتصال') } finally { setSaving(false) }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="إعدادات المنصة" subtitle="تحكم بأسعار الخطط والعمولة وبيانات الدفع" />

        {loading ? (
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-4">الإعدادات العامة</h3>
                <div className="space-y-4">
                  <Input label="اسم المنصة" value={form.platform_name || ''} onChange={set('platform_name')} />
                  <Input label="رابط المنصة" value={form.platform_url || ''} onChange={set('platform_url')} />
                  <Input label="العملة الافتراضية" value={form.default_currency || 'DZD'} onChange={set('default_currency')} />
                  <Input type="number" label="نسبة العمولة (%)" value={form.platform_fee_percent ?? '10'} onChange={set('platform_fee_percent')} min={0} max={100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-4">خطط الاشتراك</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input type="number" label="سعر الشهر الأول (دج)" value={form.plan_first_price ?? '300'} onChange={set('plan_first_price')} min={0} />
                  <Input type="number" label="سعر التجديد الشهري (دج)" value={form.plan_renew_price ?? '1000'} onChange={set('plan_renew_price')} min={0} />
                  <Input type="number" label="أيام أول اشتراك" value={form.plan_first_days ?? '30'} onChange={set('plan_first_days')} min={1} />
                  <Input type="number" label="أيام التجديد" value={form.plan_days ?? '30'} onChange={set('plan_days')} min={1} />
                  <Input type="number" label="حد المنتجات في الخطة المجانية" value={form.free_max_products ?? '5'} onChange={set('free_max_products')} min={1} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-1">تخفيض أسعار الاشتراك</h3>
                <p className="text-xs text-gray-500 mb-4">عرض ترويجي تديره مباشرة — يظهر السعر المخفّض مع شارة «خصم X%» في صفحة الخطط والأسعار. ضع 0 لإيقاف العرض.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input type="number" label="نسبة التخفيض (%)" value={form.plan_discount_percent ?? '0'} onChange={set('plan_discount_percent')} min={0} max={95} />
                  <Select
                    label="ينطبق على"
                    value={String(form.plan_discount_scope ?? 'ALL')}
                    onChange={e => setForm(f => ({ ...f, plan_discount_scope: e.target.value }))}
                    options={[
                      { value: 'ALL', label: 'أول اشتراك و التجديد معًا' },
                      { value: 'FIRST', label: 'أول اشتراك فقط' },
                      { value: 'RENEW', label: 'التجديد فقط' },
                    ]}
                  />
                  <Input type="date" label="بداية العرض (اختياري)" value={form.plan_discount_starts_at ?? ''} onChange={set('plan_discount_starts_at')} />
                  <Input type="date" label="نهاية العرض (اختياري)" value={form.plan_discount_ends_at ?? ''} onChange={set('plan_discount_ends_at')} />
                </div>
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 text-xs text-gray-600">
                  فعلي: الشهر الأول {form.plan_discount_scope !== 'RENEW' && Number(form.plan_discount_percent) > 0 ? `(خصم ${form.plan_discount_percent}% ← ${Math.round((Number(form.plan_first_price) || 300) * (100 - Number(form.plan_discount_percent)) / 100)} دج)` : ''} — التجديد {form.plan_discount_scope !== 'FIRST' && Number(form.plan_discount_percent) > 0 ? `(خصم ${form.plan_discount_percent}% ← ${Math.round((Number(form.plan_renew_price) || 1000) * (100 - Number(form.plan_discount_percent)) / 100)} دج)` : ''}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-1">إعدادات السحب</h3>
                <p className="text-xs text-gray-500 mb-4">تتحكم في طلبات سحب المبدعين إلى حساباتهم البنكية.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input type="number" label="الحد الأدنى للسحب (دج)" value={form.payout_min_amount ?? '1000'} onChange={set('payout_min_amount')} min={100} />
                  <Input type="number" label="مهلة استحقاق الأرباح (يوم)" value={form.payout_hold_days ?? '7'} onChange={set('payout_hold_days')} min={0} max={90} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-4">بيانات الدفع (تحويل بنكي)</h3>
                <div className="space-y-4">
                  <Input label="حساب CCP (رقم العملية)" value={form.bank_account_ccp || ''} onChange={set('bank_account_ccp')} placeholder="مثال: 12345678 Clé 90" />
                  <Input label="اسم صاحب الحساب" value={form.bank_account_name || ''} onChange={set('bank_account_name')} placeholder="مثال: R2 Platform" />
                </div>
                <div className="flex items-center justify-between mt-4 p-3 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">وضع الصيانة</p>
                    <p className="text-xs text-gray-500">تعليق الوصول للمستخدمين مؤقتًا</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, maintenance_mode: f.maintenance_mode === 'true' ? 'false' : 'true' }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.maintenance_mode === 'true' ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${form.maintenance_mode === 'true' ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              </CardContent>
            </Card>

            {saved && <p className="text-sm text-emerald-600 font-medium">تم حفظ الإعدادات بنجاح</p>}
            <Button type="button" onClick={save} loading={saving}>حفظ الإعدادات</Button>
          </div>
        )}
      </main>
    </div>
  )
}