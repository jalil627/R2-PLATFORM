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
import { Avatar } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/utils'

function Icon({ path, className = 'w-5 h-5' }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

interface CreatorUser {
  name?: string | null
  email?: string | null
  avatar?: string | null
  isBanned?: boolean
}

interface CreatorStore {
  name?: string | null
}

interface Creator {
  id: string
  isVerified: boolean
  commissionRate: number
  productCount?: number
  totalSales?: number
  totalEarnings?: number
  availableBalance?: number
  pendingBalance?: number
  user?: CreatorUser | null
  store?: CreatorStore | null
}

interface CreatorListResult {
  data: Creator[]
  total: number
  totalPages: number
}

async function getCreators(page: number, search: string, verifiedFilter: string): Promise<CreatorListResult> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: '20',
    q: search,
    ...(verifiedFilter && { verified: verifiedFilter }),
  })
  const res = await fetch(`/api/admin/creators?${params}`)
  const data = await res.json()
  if (data.success) {
    return {
      data: data.data as Creator[],
      total: data.total as number,
      totalPages: data.totalPages as number,
    }
  }
  return { data: [], total: 0, totalPages: 1 }
}

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [current, setCurrent] = useState<Creator | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function refreshCreators() {
    setLoading(true)
    try {
      const r = await getCreators(page, search, verifiedFilter)
      setCreators(r.data)
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
    getCreators(page, search, verifiedFilter)
      .then((r) => {
        if (cancelled) return
        setCreators(r.data)
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
  }, [page, search, verifiedFilter])

  function openModal(creator: Creator | null) {
    setCurrent(creator)
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!current) return
    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      const res = await fetch(`/api/admin/creators/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isVerified: formData.get('isVerified') === 'on' || formData.get('isVerified') === 'true',
          commissionRate: formData.get('commissionRate') ? parseFloat(formData.get('commissionRate') as string) : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setDialogOpen(false)
        setCurrent(null)
        refreshCreators()
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

  async function toggleVerified(creator: Creator) {
    setUpdating(creator.id)
    try {
      const res = await fetch(`/api/admin/creators/${creator.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !creator.isVerified }),
      })
      const data = await res.json()
      if (data.success) refreshCreators()
      else alert(data.error || 'فشل التحديث')
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(null)
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLoading(true)
    setSearch(e.target.value)
    setPage(1)
  }

  function handleVerifiedChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLoading(true)
    setVerifiedFilter(e.target.value)
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
        <DashboardHeader title="إدارة المبدعين" subtitle={`${total} مبدع`} />

        <Modal open={dialogOpen} onClose={() => { setDialogOpen(false); setCurrent(null) }} title="إعدادات المبدع" size="md">
          {current && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-sm space-y-1 bg-gray-50 rounded-lg p-3">
                <p><strong>الاسم:</strong> {current.user?.name || '—'}</p>
                <p><strong>البريد:</strong> {current.user?.email || '—'}</p>
                <p><strong>المتجر:</strong> {current.store?.name || '—'}</p>
                <p><strong>المنتجات:</strong> {current.productCount || 0}</p>
                <p><strong>إجمالي الأرباح:</strong> {formatCurrency(current.totalEarnings || 0)}</p>
                <p><strong>الرصيد المتاح:</strong> {formatCurrency(current.availableBalance || 0)}</p>
                <p><strong>الرصيد المعلق:</strong> {formatCurrency(current.pendingBalance || 0)}</p>
                <p><strong>المبيعات:</strong> {current.totalSales || 0}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    name="isVerified"
                    defaultChecked={current.isVerified}
                    className="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                  />
                  مبدع موثق
                </label>
              </div>
              <Input
                label="نسبة العمولة (٪)"
                type="number"
                step="0.1"
                min="0"
                max="100"
                name="commissionRate"
                defaultValue={current.commissionRate}
                placeholder="مثال: 10"
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
                placeholder="ابحث بالاسم أو البريد أو المتجر..."
                value={search}
                onChange={handleSearchChange}
                className="max-w-xs flex-1"
              />
              <Select
                value={verifiedFilter}
                onChange={handleVerifiedChange}
                options={[
                  { value: '', label: '— الكل —' },
                  { value: 'verified', label: 'موثق' },
                  { value: 'unverified', label: 'غير موثق' },
                ]}
                className="w-40"
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
                        <th className="px-4 py-3 font-medium">المبدع</th>
                        <th className="px-4 py-3 font-medium">المتجر</th>
                        <th className="px-4 py-3 font-medium">المنتجات</th>
                        <th className="px-4 py-3 font-medium">المبيعات</th>
                        <th className="px-4 py-3 font-medium">الأرباح</th>
                        <th className="px-4 py-3 font-medium">العمولة</th>
                        <th className="px-4 py-3 font-medium">الحالة</th>
                        <th className="px-4 py-3 font-medium">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creators.map(creator => (
                        <tr key={creator.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={creator.user?.name || creator.user?.email || '؟'} src={creator.user?.avatar || null} size="sm" />
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">{creator.user?.name || '—'}</p>
                                <p className="text-xs text-gray-400 truncate">{creator.user?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{creator.store?.name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{creator.productCount || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{creator.totalSales || 0}</td>
                          <td className="px-4 py-3 text-sm font-medium text-emerald-600">{formatCurrency(creator.totalEarnings || 0)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{creator.commissionRate}٪</td>
                          <td className="px-4 py-3">
                            {creator.user?.isBanned
                              ? <Badge variant="danger">محظور</Badge>
                              : creator.isVerified
                                ? <Badge variant="success">موثق</Badge>
                                : <Badge variant="warning">غير موثق</Badge>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openModal(creator)}>
                                <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" loading={updating === creator.id} onClick={() => toggleVerified(creator)}>
                                <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
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
