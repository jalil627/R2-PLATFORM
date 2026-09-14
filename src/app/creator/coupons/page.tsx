'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

interface CreatorCoupon {
  id: string
  code: string
  discountType: string
  discountValue: number
  minOrderAmount?: number | null
  maxUses?: number | null
  currentUses?: number | null
  expiresAt?: string | null
  isActive: boolean
  product?: { title?: string | null } | null
}

export default function CreatorCouponsPage() {
  const [coupons, setCoupons] = useState<CreatorCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = () => {
    fetch('/api/coupons')
      .then(r => r.json())
      .then(d => { setCoupons(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(load, [])

  const gate = useProGate()
  const locked = !gate.loading && !gate.isPro

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setSuccess(`تم نسخ الكود ${code} ✓`)
      setTimeout(() => setSuccess(''), 2000)
    } catch {}
  }

  const toggleActive = async (c: CreatorCoupon) => {
    const res = await fetch(`/api/coupons/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !c.isActive }),
    })
    const d = await res.json()
    if (d.success) load()
    else setError(d.error || 'فشلت العملية')
  }

  const removeCoupon = async (c: CreatorCoupon) => {
    if (!window.confirm(`حذف كوبون ${c.code} نهائيًا؟`)) return
    const res = await fetch(`/api/coupons/${c.id}`, { method: 'DELETE' })
    const d = await res.json()
    if (d.success) load()
    else setError(d.error || 'فشل الحذف')
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (!res.ok || !d.success) {
      setError(d.error || 'حدث خطأ ما')
      return
    }
    setSuccess(`تم إنشاء الكوبون ${d.data.code} بنجاح`)
    setForm({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '' })
    setShowCreate(false)
    load()
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={creatorLinks} title="لوحة التحكم" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="الكوبونات" subtitle="أنشئ كوبونات خصم لمنتجاتك" actions={
          gate.isPro ? <Button onClick={() => setShowCreate(true)}>كوبون جديد</Button> : undefined
        } />

        <ProLocked locked={locked}>
        <Card>
          {loading ? (
            <CardContent><div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div></CardContent>
          ) : coupons.length === 0 ? (
            <CardContent>
              <p className="text-center text-gray-500 py-12">لا توجد كوبونات بعد — أنشئ أول كوبون خصم لك.</p>
            </CardContent>
          ) : (
            <CardContent>
              <div className="space-y-3">
                {coupons.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-lg text-gray-900">{c.code}</span>
                        <Badge variant={c.isActive ? 'success' : 'default'}>{c.isActive ? 'نشط' : 'موقوف'}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {c.discountType === 'percentage' ? `خصم ${c.discountValue}%` : `خصم ${c.discountValue} دج`}
                        {c.minOrderAmount ? ` · حد أدنى ${c.minOrderAmount} دج` : ''}
                        {c.maxUses ? ` · ${c.currentUses}/${c.maxUses} استخدام` : ` · ${c.currentUses} استخدام`}
                        {c.expiresAt ? ` · ينتهي ${new Date(c.expiresAt).toLocaleDateString('ar')}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span className="text-sm text-gray-500">{c.product?.title ? c.product.title : 'لكل المنتجات'}</span>
                      <Button size="sm" variant="outline" onClick={() => copyCode(c.code)}>نسخ</Button>
                      <Button size="sm" variant={c.isActive ? 'outline' : 'success'} onClick={() => toggleActive(c)}>
                        {c.isActive ? 'إيقاف' : 'تفعيل'}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => removeCoupon(c)}>حذف</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
        </ProLocked>

        <Modal open={showCreate && gate.isPro} onClose={() => setShowCreate(false)} title="إنشاء كوبون جديد">
          <form className="space-y-4" onSubmit={create}>
            <Input label="كود الكوبون" placeholder="مثال: RAMADAN20" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Select label="نوع الخصم" options={[{ value: 'percentage', label: 'نسبة مئوية' }, { value: 'fixed', label: 'مبلغ ثابت' }]} value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })} />
              <Input type="number" label="قيمة الخصم" min={0} required value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} />
            </div>
            <Input type="number" label="الحد الأدنى للطلب (اختياري)" min={0} value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} />
            <Input type="number" label="الحد الأقصى للاستخدام (اختياري)" min={1} value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} />
            <Input type="date" label="تاريخ الانتهاء (اختياري)" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
            {error && <p className="text-sm text-blue-600">{error}</p>}
            {success && <p className="text-sm text-emerald-600">{success}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
              <Button type="submit">إنشاء الكوبون</Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  )
}