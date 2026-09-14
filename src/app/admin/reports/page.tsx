'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Select from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'

const statusOptions = [
  { value: 'PENDING', label: 'قيد الانتظار', variant: 'warning' as const },
  { value: 'REVIEWED', label: 'تمت المراجعة', variant: 'info' as const },
  { value: 'RESOLVED', label: 'تم الحل', variant: 'success' as const },
  { value: 'DISMISSED', label: 'مرفوض', variant: 'default' as const },
]
const statusMap = Object.fromEntries(statusOptions.map(s => [s.value, s]))

const reasonLabels: Record<string, string> = {
  COPYRIGHT: 'انتهاك حقوق',
  SCAM: 'احتيال',
  SPAM: 'رسائل مزعجة',
  MISLEADING: 'محتوى مضلل',
  OTHER: 'أخرى',
}

function Icon({ path, className = 'w-5 h-5' }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] || { label: status, variant: 'default' }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

interface ReportReporter {
  name?: string | null
  email?: string | null
}

interface AdminReport {
  id: string
  targetType: string
  targetId: string
  reason: string
  description?: string | null
  status: string
  resolution?: string | null
  createdAt: string
  reporter?: ReportReporter | null
}

interface ReportListResult {
  data: AdminReport[]
  total: number
  totalPages: number
}

async function getReports(page: number, statusFilter: string): Promise<ReportListResult> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: '20',
    ...(statusFilter && { status: statusFilter }),
  })
  const res = await fetch(`/api/admin/reports?${params}`)
  const data = await res.json()
  if (data.success) {
    return {
      data: data.data as AdminReport[],
      total: data.total as number,
      totalPages: data.totalPages as number,
    }
  }
  return { data: [], total: 0, totalPages: 1 }
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [current, setCurrent] = useState<AdminReport | null>(null)
  const [updating, setUpdating] = useState(false)

  async function refreshReports() {
    setLoading(true)
    try {
      const r = await getReports(page, statusFilter)
      setReports(r.data)
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
    getReports(page, statusFilter)
      .then((r) => {
        if (cancelled) return
        setReports(r.data)
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
  }, [page, statusFilter])

  function openModal(report: AdminReport) {
    setCurrent(report)
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!current) return
    setUpdating(true)
    try {
      const formData = new FormData(e.currentTarget)
      const status = formData.get('status') as string
      const resolution = (formData.get('resolution') as string) || undefined
      const res = await fetch(`/api/admin/reports/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution }),
      })
      const data = await res.json()
      if (data.success) {
        setDialogOpen(false)
        setCurrent(null)
        refreshReports()
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

  const typeLabel = (t: string) => (t === 'PRODUCT' ? 'منتج' : t === 'REVIEW' ? 'تقييم' : t === 'USER' ? 'مستخدم' : t)

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="إدارة البلاغات" subtitle={`${total} بلاغ`} />

        <Modal open={dialogOpen} onClose={() => { setDialogOpen(false); setCurrent(null) }} title="معالجة البلاغ" size="md">
          {current && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-sm space-y-2 bg-gray-50 rounded-lg p-3">
                <p><strong>النوع:</strong> {typeLabel(current.targetType)}</p>
                <p><strong>السبب:</strong> {reasonLabels[current.reason] || current.reason}</p>
                {current.description && <p className="text-gray-600"><strong>الوصف:</strong> {current.description}</p>}
                <p><strong>المبلغ:</strong> {current.reporter?.name} ({current.reporter?.email})</p>
                <p><strong>التاريخ:</strong> {new Date(current.createdAt).toLocaleString('ar-DZ-u-nu-latn')}</p>
              </div>
              <Select
                label="الحالة"
                value={current.status}
                onChange={e => setCurrent({ ...current, status: e.target.value })}
                options={statusOptions.map(s => ({ value: s.value, label: s.label }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">نوع الهدف</label>
                <input
                  type="text"
                  disabled
                  value={`${typeLabel(current.targetType)} — ${current.targetId}`}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">قرار المعالجة</label>
                <textarea
                  name="resolution"
                  defaultValue={current.resolution || ''}
                  className="w-full h-24 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setCurrent(null) }}>إلغاء</Button>
                <Button type="submit" loading={updating}>حفظ</Button>
              </div>
            </form>
          )}
        </Modal>

        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4">
              <Select
                value={statusFilter}
                onChange={handleStatusChange}
                options={[{ value: '', label: '— كل الحالات —' }, ...statusOptions.map(s => ({ value: s.value, label: s.label }))]}
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
                        <th className="px-4 py-3 font-medium">النوع</th>
                        <th className="px-4 py-3 font-medium">السبب</th>
                        <th className="px-4 py-3 font-medium">الوصف</th>
                        <th className="px-4 py-3 font-medium">المبلغ</th>
                        <th className="px-4 py-3 font-medium">الحالة</th>
                        <th className="px-4 py-3 font-medium">التاريخ</th>
                        <th className="px-4 py-3 font-medium">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(report => (
                        <tr key={report.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{typeLabel(report.targetType)}</td>
                          <td className="px-4 py-3">{reasonLabels[report.reason] || report.reason}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-[240px] truncate">
                            {report.description || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {report.reporter?.name || '—'}
                            <span className="block text-xs text-gray-400">{report.reporter?.email}</span>
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(report.createdAt).toLocaleDateString('ar-DZ-u-nu-latn')}
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="icon" onClick={() => openModal(report)}>
                              <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-4 h-4" />
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
