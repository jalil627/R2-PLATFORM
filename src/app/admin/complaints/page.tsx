'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Select from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import {
  COMPLAINT_STATUSES,
  COMPLAINT_PRIORITIES,
  complaintStatusLabel,
  complaintStatusBadge,
  complaintTypeLabel,
} from '@/lib/complaints'

function Icon({ path, className = 'w-5 h-5' }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

const editIcon = 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${complaintStatusBadge(status)}`}>
      {complaintStatusLabel(status)}
    </span>
  )
}

interface ComplaintUser {
  email?: string | null
}

interface Complaint {
  id: string
  name: string
  email: string
  type: string
  subject: string
  message: string
  status: string
  priority: string
  adminNote?: string | null
  createdAt: string
  user?: ComplaintUser | null
}

interface ComplaintListResult {
  data: Complaint[]
  total: number
  totalPages: number
  pendingCount: number
}

async function getComplaints(page: number, statusFilter: string, search: string): Promise<ComplaintListResult> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: '20',
    ...(statusFilter && { status: statusFilter }),
    ...(search.trim() && { q: search.trim() }),
  })
  const res = await fetch(`/api/admin/complaints?${params}`)
  const data = await res.json()
  if (data.success) {
    return {
      data: data.data as Complaint[],
      total: data.total as number,
      totalPages: data.totalPages as number,
      pendingCount: data.pendingCount as number,
    }
  }
  return { data: [], total: 0, totalPages: 1, pendingCount: 0 }
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [current, setCurrent] = useState<Complaint | null>(null)
  const [updating, setUpdating] = useState(false)

  async function refreshComplaints() {
    setLoading(true)
    try {
      const r = await getComplaints(page, statusFilter, search)
      setComplaints(r.data)
      setTotal(r.total)
      setTotalPages(r.totalPages)
      setPendingCount(r.pendingCount)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    getComplaints(page, statusFilter, search)
      .then((r) => {
        if (cancelled) return
        setComplaints(r.data)
        setTotal(r.total)
        setTotalPages(r.totalPages)
        setPendingCount(r.pendingCount)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, statusFilter, search])

  function openModal(complaint: Complaint) {
    setCurrent({ ...complaint, status: complaint.status, priority: complaint.priority, adminNote: complaint.adminNote || '' })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!current) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/complaints/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: current.status,
          priority: current.priority,
          adminNote: current.adminNote,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setDialogOpen(false)
        setCurrent(null)
        refreshComplaints()
      } else {
        alert(data.error || 'فشل التحديث')
      }
    } catch (err) {
      console.error(err)
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

  const priorityLabel = (p: string) => COMPLAINT_PRIORITIES.find(x => x.value === p)?.label || p

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="إدارة الشكاوى" subtitle={`${total} شكوى — ${pendingCount} قيد المراجعة`} />

        <Modal open={dialogOpen} onClose={() => { setDialogOpen(false); setCurrent(null) }} title="معالجة الشكوى" size="md">
          {current && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-sm space-y-2 bg-gray-50 rounded-lg p-3">
                <p><strong>الرقم:</strong> {current.id.slice(-8).toUpperCase()}</p>
                <p><strong>المُرسل:</strong> {current.name} ({current.email})</p>
                {current.user && <p className="text-xs text-gray-500"><strong>حساب مسجل:</strong> {current.user.email}</p>}
                <p><strong>النوع:</strong> {complaintTypeLabel(current.type)}</p>
                <p><strong>الموضوع:</strong> {current.subject}</p>
                <p className="text-gray-600 whitespace-pre-wrap"><strong>التفاصيل:</strong> {current.message}</p>
                <p><strong>التاريخ:</strong> {new Date(current.createdAt).toLocaleString('ar-DZ-u-nu-latn')}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="الحالة"
                  value={current.status}
                  onChange={e => setCurrent({ ...current, status: e.target.value })}
                  options={COMPLAINT_STATUSES.map(s => ({ value: s.value, label: s.label }))}
                />
                <Select
                  label="الأولوية"
                  value={current.priority}
                  onChange={e => setCurrent({ ...current, priority: e.target.value })}
                  options={COMPLAINT_PRIORITIES.map(p => ({ value: p.value, label: p.label }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ملاحظة الإدارة</label>
                <textarea
                  value={current.adminNote || ''}
                  onChange={e => setCurrent({ ...current, adminNote: e.target.value })}
                  placeholder="اكتب ملاحظة أو ردًا يظهر للمستخدم عند تتبع الشكوى..."
                  className="w-full h-24 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setCurrent(null) }}>إلغاء</Button>
                <Button type="submit" loading={updating}>حفظ التغييرات</Button>
              </div>
            </form>
          )}
        </Modal>

        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center">
              <Select
                value={statusFilter}
                onChange={handleStatusChange}
                options={[{ value: '', label: '— كل الحالات —' }, ...COMPLAINT_STATUSES.map(s => ({ value: s.value, label: s.label }))]}
                className="w-48"
              />
              <div className="w-56">
                <Input
                  placeholder="بحث بالاسم أو البريد أو الموضوع..."
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>
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
                        <th className="px-4 py-3 font-medium">الرقم</th>
                        <th className="px-4 py-3 font-medium">المُرسل</th>
                        <th className="px-4 py-3 font-medium">النوع</th>
                        <th className="px-4 py-3 font-medium">الموضوع</th>
                        <th className="px-4 py-3 font-medium">الأولوية</th>
                        <th className="px-4 py-3 font-medium">الحالة</th>
                        <th className="px-4 py-3 font-medium">التاريخ</th>
                        <th className="px-4 py-3 font-medium">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map(c => (
                        <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-900">{c.id.slice(-8).toUpperCase()}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {c.name}
                            <span className="block text-xs text-gray-400">{c.email}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{complaintTypeLabel(c.type)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-[220px] truncate">{c.subject}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{priorityLabel(c.priority)}</td>
                          <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(c.createdAt).toLocaleDateString('ar-DZ-u-nu-latn')}
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="icon" onClick={() => openModal(c)}>
                              <Icon path={editIcon} className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {complaints.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                            لا توجد شكاوى مطابقة
                          </td>
                        </tr>
                      )}
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
