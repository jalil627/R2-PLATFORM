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
import { StarRating } from '@/components/ui/star-rating'

function Icon({ path, className = 'w-5 h-5' }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

interface ReviewUser {
  name?: string | null
  email?: string | null
}

interface ReviewProduct {
  title?: string | null
}

interface AdminReview {
  id: string
  rating: number
  title?: string | null
  text?: string | null
  isHidden: boolean
  isVerifiedPurchase?: boolean
  creatorResponse?: string | null
  createdAt: string
  product?: ReviewProduct | null
  user?: ReviewUser | null
}

interface ReviewListResult {
  data: AdminReview[]
  total: number
  totalPages: number
}

async function getReviews(page: number, search: string, ratingFilter: string, hiddenFilter: string): Promise<ReviewListResult> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: '20',
    q: search,
    ...(ratingFilter && { rating: ratingFilter }),
    ...(hiddenFilter && { hidden: hiddenFilter }),
  })
  const res = await fetch(`/api/admin/reviews?${params}`)
  const data = await res.json()
  if (data.success) {
    return {
      data: data.data as AdminReview[],
      total: data.total as number,
      totalPages: data.totalPages as number,
    }
  }
  return { data: [], total: 0, totalPages: 1 }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [hiddenFilter, setHiddenFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [current, setCurrent] = useState<AdminReview | null>(null)

  async function refreshReviews() {
    setLoading(true)
    try {
      const r = await getReviews(page, search, ratingFilter, hiddenFilter)
      setReviews(r.data)
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
    getReviews(page, search, ratingFilter, hiddenFilter)
      .then((r) => {
        if (cancelled) return
        setReviews(r.data)
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
  }, [page, search, ratingFilter, hiddenFilter])

  async function toggleHidden(review: AdminReview) {
    setUpdatingId(review.id)
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !review.isHidden }),
      })
      const data = await res.json()
      if (data.success) refreshReviews()
      else alert(data.error || 'فشل التحديث')
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatingId(null)
    }
  }

  function openView(review: AdminReview) {
    setCurrent(review)
    setViewOpen(true)
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLoading(true)
    setSearch(e.target.value)
    setPage(1)
  }

  function handleRatingChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLoading(true)
    setRatingFilter(e.target.value)
    setPage(1)
  }

  function handleHiddenChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLoading(true)
    setHiddenFilter(e.target.value)
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
        <DashboardHeader title="إدارة التقييمات" subtitle={`${total} تقييم`} />

        <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="تفاصيل التقييم" size="md">
          {current && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <StarRating value={current.rating} readonly size="sm" />
                <span className="text-gray-500">{current.rating} / 5</span>
              </div>
              {current.title && <p className="font-medium">{current.title}</p>}
              <p className="text-gray-700 whitespace-pre-wrap">{current.text || 'لا يوجد نص'}</p>
              <div className="pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                <p>المنتج: {current.product?.title || '—'}</p>
                <p>المستخدم: {current.user?.name} ({current.user?.email})</p>
                <p>تاريخ: {new Date(current.createdAt).toLocaleString('ar-DZ-u-nu-latn')}</p>
                {current.isVerifiedPurchase && <p className="text-green-600">شراء موثق</p>}
              </div>
              {current.creatorResponse && (
                <div className="bg-blue-50 rounded-lg p-3 text-xs">
                  <p className="font-medium mb-1">رد المبدع:</p>
                  <p>{current.creatorResponse}</p>
                </div>
              )}
            </div>
          )}
        </Modal>

        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4">
              <Input
                placeholder="ابحث عن مستخدم أو منتج..."
                value={search}
                onChange={handleSearchChange}
                className="max-w-xs flex-1"
              />
              <Select
                value={ratingFilter}
                onChange={handleRatingChange}
                options={[
                  { value: '', label: '— كل التقييمات —' },
                  { value: '5', label: '5 نجوم' },
                  { value: '4', label: '4 نجوم' },
                  { value: '3', label: '3 نجوم' },
                  { value: '2', label: 'نجمتان' },
                  { value: '1', label: 'نجمة واحدة' },
                ]}
                className="w-44"
              />
              <Select
                value={hiddenFilter}
                onChange={handleHiddenChange}
                options={[
                  { value: '', label: '— الكل —' },
                  { value: 'visible', label: 'ظاهر' },
                  { value: 'hidden', label: 'مخفي' },
                ]}
                className="w-44"
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
                        <th className="px-4 py-3 font-medium">المنتج</th>
                        <th className="px-4 py-3 font-medium">المستخدم</th>
                        <th className="px-4 py-3 font-medium">التقييم</th>
                        <th className="px-4 py-3 font-medium">النص</th>
                        <th className="px-4 py-3 font-medium">الحالة</th>
                        <th className="px-4 py-3 font-medium">التاريخ</th>
                        <th className="px-4 py-3 font-medium">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map(review => (
                        <tr key={review.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900">{review.product?.title || '—'}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {review.user?.name || '—'}
                            <span className="block text-xs text-gray-400">{review.user?.email}</span>
                          </td>
                          <td className="px-4 py-3">
                            <StarRating value={review.rating} readonly size="sm" />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-[240px] truncate">
                            {review.text || review.title || '—'}
                          </td>
                          <td className="px-4 py-3">
                            {review.isHidden
                              ? <Badge variant="danger">مخفي</Badge>
                              : <Badge variant="success">ظاهر</Badge>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('ar-DZ-u-nu-latn')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openView(review)}>
                                <Icon path="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" loading={updatingId === review.id} onClick={() => toggleHidden(review)}>
                                <Icon path={review.isHidden ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18' : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M12 2a10 10 0 110 20 10 10 0 010-20z'} className="w-4 h-4" />
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
