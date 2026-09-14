'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Select from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'

function Icon({ path, className = 'w-5 h-5' }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

interface CouponCreatorUser {
  name?: string | null
  email?: string | null
}

interface CouponCreator {
  user?: CouponCreatorUser | null
}

interface CouponProduct {
  title?: string | null
}

interface CouponCount {
  usages?: number
}

interface Coupon {
  id: string
  code: string
  discountType: string
  discountValue: number
  maxUses?: number | null
  isActive: boolean
  expiresAt?: string | null
  scope?: string | null
  creatorId?: string | null
  creator?: CouponCreator | null
  product?: CouponProduct | null
  _count?: CouponCount | null
}

interface ProductOption {
  id: string
  title: string
}

interface CouponListResult {
  data: Coupon[]
  total: number
  totalPages: number
}

async function getCoupons(page: number, search: string): Promise<CouponListResult> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: '20',
    q: search,
  })
  const res = await fetch(`/api/admin/coupons?${params}`)
  const data = await res.json()
  if (data.success) {
    return {
      data: data.data as Coupon[],
      total: data.total as number,
      totalPages: data.totalPages as number,
    }
  }
  return { data: [], total: 0, totalPages: 1 }
}

async function getProductOptions(): Promise<ProductOption[]> {
  const res = await fetch('/api/products?pageSize=100&status=all')
  const d = await res.json()
  return (d.data as ProductOption[]) || []
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [current, setCurrent] = useState<Coupon | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [products, setProducts] = useState<ProductOption[]>([])

  useEffect(() => {
    let cancelled = false
    getProductOptions()
      .then((list) => {
        if (cancelled) return
        setProducts(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  async function refreshCoupons() {
    setLoading(true)
    try {
      const r = await getCoupons(page, search)
      setCoupons(r.data)
      setTotal(r.total)
      setTotalPages(r.totalPages)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    getCoupons(page, search)
      .then((r) => {
        if (cancelled) return
        setCoupons(r.data)
        setTotal(r.total)
        setTotalPages(r.totalPages)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, search])

  function openModal(coupon: Coupon | null) {
    setCurrent(coupon)
    setDialogOpen(true)
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreateSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.get('code'),
          discountType: formData.get('discountType'),
          discountValue: formData.get('discountValue'),
          minOrderAmount: (formData.get('minOrderAmount') as string) || null,
          maxUses: (formData.get('maxUses') as string) || null,
          productId: (formData.get('productId') as string) || null,
          startsAt: (formData.get('startsAt') as string) || null,
          expiresAt: (formData.get('expiresAt') as string) || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setCreateOpen(false)
        refreshCoupons()
      } else {
        alert(data.error || 'فشل الإنشاء')
      }
    } catch (err) {
      console.error(err)
      alert('خطأ في الاتصال')
    } finally {
      setCreateSaving(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!current) return
    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      const res = await fetch(`/api/admin/coupons/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true',
          discountValue: formData.get('discountValue') ? parseFloat(formData.get('discountValue') as string) : undefined,
          maxUses: formData.get('maxUses') ? parseInt(formData.get('maxUses') as string) : undefined,
          expiresAt: (formData.get('expiresAt') as string) || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setDialogOpen(false)
        setCurrent(null)
        refreshCoupons()
      } else {
        alert(data.error || 'فشل التحديث')
      }
    } catch (e) {
      console.error(e)
      alert('خطأ في الاتصال')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(coupon: Coupon) {
    setUpdating(coupon.id)
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      })
      const data = await res.json()
      if (data.success) refreshCoupons()
      else alert(data.error || 'فشل التحديث')
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(null)
    }
  }

  function formatDate(d?: string | null) {
    if (!d) return 'بدون تاريخ انتهاء'
    return new Date(d).toLocaleDateString('ar-DZ-u-nu-latn')
  }

  const scopeOf = (c: Coupon) => c.scope || (c.creatorId ? 'CREATOR' : 'PLATFORM')

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLoading(true)
    setSearch(e.target.value)
    setPage(1)
  }

  function handlePrevPage() {
    setLoading(true)
    setPage((p) => Math.max(1, p - 1))
  }

  function handleNextPage() {
    setLoading(true)
    setPage((p) => Math.min(totalPages, p + 1))
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="إدارة الكوبونات" subtitle={`${total} كوبون`} actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>+ كوبون منصة جديد</Button>
        } />

        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="إنشاء كوبون تخفيض من المنصة" size="lg">
          <form onSubmit={handleCreate} className="space-y-4">
            <p className="text-sm text-gray-500 bg-blue-50 rounded-lg p-3">
              كوبون منصة يطبّقه الزبون على أي منتج في السوق (أو على منتج محدد). يحدده الأدمن ويستطيع تغيير قيمته أو إيقافه في أي وقت.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="الكود" name="code" placeholder="مثال: SELAM50" required />
              <Select
                label="نوع الخصم"
                name="discountType"
                defaultValue="percentage"
                options={[
                  { value: 'percentage', label: 'نسبة مئوية (%)' },
                  { value: 'fixed', label: 'مبلغ ثابت (دج)' },
                ]}
              />
              <Input label="قيمة الخصم" name="discountValue" type="number" step="0.01" placeholder="10" required />
              <Input label="الحد الأدنى للطلب (اختياري)" name="minOrderAmount" type="number" step="0.01" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="الحد الأقصى للاستخدام (اختياري)" name="maxUses" type="number" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ينطبق على</label>
                <Select
                  name="productId"
                  defaultValue=""
                  options={[
                    { value: '', label: 'كل منتجات السوق' },
                    ...products.map(p => ({ value: p.id, label: p.title })),
                  ]}
                />
              </div>
              <Input label="تاريخ البداية (اختياري)" name="startsAt" type="date" />
              <Input label="تاريخ الانتهاء (اختياري)" name="expiresAt" type="date" />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>إلغاء</Button>
              <Button type="submit" loading={createSaving}>إنشاء الكوبون</Button>
            </div>
          </form>
        </Modal>

        <Modal open={dialogOpen} onClose={() => { setDialogOpen(false); setCurrent(null) }} title="تعديل الكوبون" size="md">
          {current && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-sm space-y-1 bg-gray-50 rounded-lg p-3">
                <p><strong>الكود:</strong> <code className="font-mono">{current.code}</code></p>
                <p><strong>المبدع:</strong> {scopeOf(current) === 'PLATFORM' ? 'المنصة (كوبون عام)' : (current.creator?.user?.name || '—')}</p>
                <p><strong>الخصم:</strong> {current.discountType === 'percentage' ? `${current.discountValue}%` : `${current.discountValue} دج`}</p>
                <p><strong>الاستخدامات:</strong> {current._count?.usages || 0}{current.maxUses ? ` / ${current.maxUses}` : ''}</p>
                <p><strong>ينطبق على:</strong> {current.product ? current.product.title : 'كل المنتجات'}</p>
                <p><strong>انتهاء:</strong> {formatDate(current.expiresAt)}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={current.isActive}
                    className="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                  />
                  الكوبون نشط
                </label>
              </div>
              <Input
                label="قيمة الخصم"
                type="number"
                step="0.01"
                name="discountValue"
                defaultValue={current.discountValue}
                placeholder="مثال: 10"
              />
              <Input
                label="الحد الأقصى للاستخدام"
                type="number"
                name="maxUses"
                defaultValue={current.maxUses ?? ''}
                placeholder="اتركه فارغًا لغير محدود"
              />
              <Input
                label="تاريخ الانتهاء"
                type="date"
                name="expiresAt"
                defaultValue={current.expiresAt ? new Date(current.expiresAt).toISOString().slice(0, 10) : ''}
              />
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setCurrent(null) }}>إلغاء</Button>
                <Button type="submit" loading={saving}>حفظ</Button>
              </div>
            </form>
          )}
        </Modal>

        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4">
              <Input
                placeholder="ابحث بكود الكوبون..."
                value={search}
                onChange={handleSearchChange}
                className="max-w-xs flex-1"
              />
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <svg className="w-8 h-8 animate-spin mx-auto text-blue-700" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
                        <th className="px-4 py-3 font-medium">الكود</th>
                        <th className="px-4 py-3 font-medium">المبدع</th>
                        <th className="px-4 py-3 font-medium">الخصم</th>
                        <th className="px-4 py-3 font-medium">الاستخدامات</th>
                        <th className="px-4 py-3 font-medium">نطاق</th>
                        <th className="px-4 py-3 font-medium">ينتهي</th>
                        <th className="px-4 py-3 font-medium">الحالة</th>
                        <th className="px-4 py-3 font-medium">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map(coupon => (
                        <tr key={coupon.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-sm font-medium text-blue-700">{coupon.code}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {scopeOf(coupon) === 'PLATFORM' ? (
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-700">
                                المنصة
                              </span>
                            ) : (
                              <>
                                {coupon.creator?.user?.name || '—'}
                                <span className="block text-xs text-gray-400">{coupon.creator?.user?.email}</span>
                              </>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue} دج`}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {coupon._count?.usages || 0}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {coupon.product ? coupon.product.title : 'الكل'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(coupon.expiresAt)}</td>
                          <td className="px-4 py-3">
                            {coupon.isActive
                              ? <Badge variant="success">نشط</Badge>
                              : <Badge variant="danger">معطل</Badge>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openModal(coupon)}>
                                <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" loading={updating === coupon.id} onClick={() => toggleActive(coupon)}>
                                <Icon path={coupon.isActive ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18'} className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500">الصفحة {page} من {totalPages} — إجمالي {total}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page === 1}>السابق</Button>
                      <Button variant="outline" size="sm" onClick={handleNextPage} disabled={page === totalPages}>التالي</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
