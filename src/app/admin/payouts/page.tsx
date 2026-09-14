'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import Select from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'

const payoutStatusOptions = [
  { value: 'REQUESTED', label: 'مطلوب', variant: 'default' as const },
  { value: 'PENDING', label: 'قيد الانتظار', variant: 'warning' as const },
  { value: 'PROCESSING', label: 'قيد المعالجة', variant: 'info' as const },
  { value: 'PAID', label: 'مدفوع', variant: 'success' as const },
  { value: 'FAILED', label: 'فشل', variant: 'danger' as const },
  { value: 'CANCELLED', label: 'ملغي', variant: 'default' as const },
]

const payoutStatusMap = Object.fromEntries(payoutStatusOptions.map(s => [s.value, s]))

function StatusBadge({ status }: { status: string }) {
  const s = payoutStatusMap[status] || { label: status, variant: 'default' }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

function Icon({ path, className = 'w-5 h-5' }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

interface PayoutCreatorUser {
  name?: string | null
  email?: string | null
}

interface PayoutCreator {
  user?: PayoutCreatorUser | null
}

interface PayoutDetails {
  method?: string
  holderName?: string
  account?: string
  key?: string
}

const PAYOUT_METHOD_LABELS: Record<string, string> = {
  ccp: 'CCP / بريدي جاري',
  rip: 'تحويل بنكي (RIP)',
  baridimob: 'بريدي موب (BaridiMob)',
}

interface Payout {
  id: string
  amount: number
  status: string
  providerPayoutId?: string | null
  notes?: string | null
  details?: unknown
  createdAt: string
  creator?: PayoutCreator | null
}

interface PayoutListResult {
  data: Payout[]
  total: number
  totalPages: number
}

async function getPayouts(page: number, search: string, statusFilter: string): Promise<PayoutListResult> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: '20',
    q: search,
    ...(statusFilter && { status: statusFilter }),
  })
  const res = await fetch(`/api/admin/payouts?${params}`)
  const data = await res.json()
  if (data.success) {
    return {
      data: data.data as Payout[],
      total: data.total as number,
      totalPages: data.totalPages as number,
    }
  }
  return { data: [], total: 0, totalPages: 1 }
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [updating, setUpdating] = useState(false)

  async function refreshPayouts() {
    setLoading(true)
    try {
      const r = await getPayouts(page, search, statusFilter)
      setPayouts(r.data)
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
    getPayouts(page, search, statusFilter)
      .then((r) => {
        if (cancelled) return
        setPayouts(r.data)
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
  }, [page, search, statusFilter])

  function openModal(payout: Payout) {
    setSelectedPayout(payout)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setSelectedPayout(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedPayout) return
    setUpdating(true)
    try {
      const formData = new FormData(e.currentTarget)
      const status = formData.get('status')
      const providerPayoutId = formData.get('providerPayoutId')
      const notes = formData.get('notes')
      const res = await fetch(`/api/admin/payouts/${selectedPayout.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, providerPayoutId: providerPayoutId || undefined, notes: notes || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        closeDialog()
        refreshPayouts()
      } else {
        alert(data.error || 'فشل التحديث')
      }
    } catch (e) {
      console.error(e)
      alert('خطأ في الاتصال')
    } finally {
      setUpdating(false)
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLoading(true)
    setSearch(e.target.value)
    setPage(1)
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLoading(true)
    setStatusFilter(e.target.value)
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

  const statusSelectOptions = [
    { value: '', label: '— الكل —' },
    ...payoutStatusOptions.map(s => ({ value: s.value, label: s.label })),
  ]

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="إدارة المسحوبات" subtitle={`${total} سحب`} />

        <Modal open={dialogOpen} onClose={closeDialog} title="تحديث حالة السحب" size="md">
          {selectedPayout && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-sm text-gray-500 space-y-1">
                <p><strong>المبدع:</strong> {selectedPayout.creator?.user?.name || '—'} ({selectedPayout.creator?.user?.email || '—'})</p>
                <p><strong>المبلغ:</strong> {formatCurrency(selectedPayout.amount)}</p>
                <p><strong>التاريخ:</strong> {new Date(selectedPayout.createdAt).toLocaleDateString('ar-DZ-u-nu-latn')}</p>
              </div>
              <Select
                label="الحالة"
                value={selectedPayout.status}
                onChange={e => setSelectedPayout({ ...selectedPayout, status: e.target.value })}
                options={payoutStatusOptions.map(s => ({ value: s.value, label: s.label }))}
              />
              <Input
                label="معرّف الدفع الخارجي (اختياري)"
                value={selectedPayout.providerPayoutId || ''}
                onChange={e => setSelectedPayout({ ...selectedPayout, providerPayoutId: e.target.value })}
                placeholder="مثال: pay_123456"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ملاحظات</label>
                <textarea
                  name="notes"
                  defaultValue={selectedPayout.notes || ''}
                  className="w-full h-20 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              {Boolean(selectedPayout.details) && (() => {
                const d = (selectedPayout.details || {}) as PayoutDetails
                return (
                  <div className="text-sm bg-gray-50 rounded-lg p-3 space-y-1">
                    <p className="font-bold text-gray-700 mb-1">بيانات التحويل البنكي</p>
                    <p><span className="text-gray-400">الطريقة: </span><strong>{(d.method && PAYOUT_METHOD_LABELS[d.method]) || d.method || '—'}</strong></p>
                    <p><span className="text-gray-400">صاحب الحساب: </span><strong>{d.holderName || '—'}</strong></p>
                    <p><span className="text-gray-400">رقم الحساب: </span><strong className="font-mono" dir="ltr">{d.account || '—'}</strong>{d.key ? <span> <span className="text-gray-400">المفتاح: </span><strong className="font-mono" dir="ltr">{d.key}</strong></span> : null}</p>
                  </div>
                )
              })()}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={closeDialog}>إلغاء</Button>
                <Button type="submit" loading={updating}>حفظ</Button>
              </div>
            </form>
          )}
        </Modal>

        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4">
              <Input
                placeholder="ابحث باسم المبدع أو البريد..."
                value={search}
                onChange={handleSearchChange}
                className="max-w-xs flex-1"
              />
              <Select
                value={statusFilter}
                onChange={handleStatusChange}
                options={statusSelectOptions}
                className="w-48"
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
                        <th className="px-4 py-3 font-medium">المبلغ</th>
                        <th className="px-4 py-3 font-medium">الحالة</th>
                        <th className="px-4 py-3 font-medium">معرّف الدفع</th>
                        <th className="px-4 py-3 font-medium">التاريخ</th>
                        <th className="px-4 py-3 font-medium">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map(payout => (
                        <tr key={payout.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900">{payout.creator?.user?.name || '—'}</span>
                            <br />
                            <span className="text-xs text-gray-500">{payout.creator?.user?.email || '—'}</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(payout.amount)}</td>
                          <td className="px-4 py-3"><StatusBadge status={payout.status} /></td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">{payout.providerPayoutId || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(payout.createdAt).toLocaleDateString('ar-DZ-u-nu-latn')}
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="icon" onClick={() => openModal(payout)}>
                              <Icon path="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" className="w-4 h-4" />
                            </Button>
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
