'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

interface AffiliateUser {
  name?: string | null
  email?: string | null
  avatar?: string | null
}

interface AffiliateProduct {
  title?: string | null
  price?: number | null
}

interface AffiliateCount {
  clicks?: number
  conversions?: number
}

interface AffiliateLink {
  id: string
  code: string
  isActive: boolean
  commissionRate: number
  user?: AffiliateUser | null
  product?: AffiliateProduct | null
  _count?: AffiliateCount | null
}

interface AffiliateListResult {
  data: AffiliateLink[]
  total: number
  totalPages: number
}

async function getAffiliateLinks(page: number, search: string): Promise<AffiliateListResult> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: '20',
    q: search,
  })
  const res = await fetch(`/api/admin/affiliates?${params}`)
  const data = await res.json()
  if (data.success) {
    return {
      data: data.data as AffiliateLink[],
      total: data.total as number,
      totalPages: data.totalPages as number,
    }
  }
  return { data: [], total: 0, totalPages: 1 }
}

export default function AdminAffiliatesPage() {
  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [current, setCurrent] = useState<AffiliateLink | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function refreshLinks() {
    setLoading(true)
    try {
      const r = await getAffiliateLinks(page, search)
      setLinks(r.data)
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
    getAffiliateLinks(page, search)
      .then((r) => {
        if (cancelled) return
        setLinks(r.data)
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

  function openModal(link: AffiliateLink | null) {
    setCurrent(link)
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!current) return
    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      const res = await fetch(`/api/admin/affiliates/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true',
          commissionRate: formData.get('commissionRate') ? parseFloat(formData.get('commissionRate') as string) : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setDialogOpen(false)
        setCurrent(null)
        refreshLinks()
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

  async function toggleActive(link: AffiliateLink) {
    setUpdating(link.id)
    try {
      const res = await fetch(`/api/admin/affiliates/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !link.isActive }),
      })
      const data = await res.json()
      if (data.success) refreshLinks()
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
        <DashboardHeader title="برنامج العمولة" subtitle={`${total} رابط تسويق`} />

        <Modal open={dialogOpen} onClose={() => { setDialogOpen(false); setCurrent(null) }} title="إعدادات رابط العمولة" size="md">
          {current && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-sm space-y-1 bg-gray-50 rounded-lg p-3">
                <p><strong>المسوق:</strong> {current.user?.name || '—'} ({current.user?.email || '—'})</p>
                <p><strong>المنتج:</strong> {current.product?.title || '—'}</p>
                <p><strong>الكود:</strong> <code className="font-mono">{current.code}</code></p>
                <p><strong>النقرات:</strong> {current._count?.clicks || 0}</p>
                <p><strong>التحويلات:</strong> {current._count?.conversions || 0}</p>
                <p><strong>السعر:</strong> {formatCurrency(current.product?.price || 0)}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={current.isActive}
                    className="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                  />
                  الرابط نشط
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
                placeholder="ابحث بالاسم أو الكود أو المنتج..."
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
                        <th className="px-4 py-3 font-medium">المسوق</th>
                        <th className="px-4 py-3 font-medium">المنتج</th>
                        <th className="px-4 py-3 font-medium">الكود</th>
                        <th className="px-4 py-3 font-medium">العمولة</th>
                        <th className="px-4 py-3 font-medium">النقرات</th>
                        <th className="px-4 py-3 font-medium">التحويلات</th>
                        <th className="px-4 py-3 font-medium">الحالة</th>
                        <th className="px-4 py-3 font-medium">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {links.map(link => (
                        <tr key={link.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={link.user?.name || link.user?.email || '؟'} src={link.user?.avatar || null} size="sm" />
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">{link.user?.name || '—'}</p>
                                <p className="text-xs text-gray-400 truncate">{link.user?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{link.product?.title || '—'}</td>
                          <td className="px-4 py-3 font-mono text-sm text-blue-700">{link.code}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{link.commissionRate}٪</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{link._count?.clicks || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{link._count?.conversions || 0}</td>
                          <td className="px-4 py-3">
                            {link.isActive
                              ? <Badge variant="success">نشط</Badge>
                              : <Badge variant="danger">معطل</Badge>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openModal(link)}>
                                <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" loading={updating === link.id} onClick={() => toggleActive(link)}>
                                <Icon path={link.isActive ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18'} className="w-4 h-4" />
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
