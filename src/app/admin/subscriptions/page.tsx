'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Select from '@/components/ui/select'
import Input from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { formatCurrency } from '@/lib/utils'

const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'قيد الانتظار', cls: 'bg-amber-100 text-amber-700' },
  PAID: { label: 'مفعّل', cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'مرفوض', cls: 'bg-red-100 text-red-700' },
}

type MemberAction = 'ACTIVATE' | 'EXTEND' | 'REVOKE'
type Decision = 'PAID' | 'REJECTED'
type SubscriptionView = 'requests' | 'active'

interface SubscriptionUser {
  memberNo?: number | null
  name?: string | null
  email?: string | null
}

interface SubscriptionRow {
  id: string
  userId?: string
  amount?: number
  reference?: string | null
  status: string
  createdAt: string
  paymentMethod?: string | null
  adminNote?: string | null
  user?: SubscriptionUser | null
  memberNo?: number | null
  name?: string | null
  email?: string | null
  planExpiresAt?: string | null
  daysLeft?: number | null
}

interface SubscriptionListResult {
  data: SubscriptionRow[]
  total: number
  totalPages: number
  pendingCount: number
}

async function getSubscriptionRows(page: number, statusFilter: string, view: SubscriptionView): Promise<SubscriptionListResult> {
  const params = new URLSearchParams({ page: page.toString(), pageSize: '20', ...(statusFilter && { status: statusFilter }) })
  if (view === 'active') params.set('view', 'active')
  const res = await fetch(`/api/admin/subscriptions?${params}`)
  const d = await res.json()
  if (d.success) {
    return {
      data: d.data as SubscriptionRow[],
      total: d.total as number,
      totalPages: (d.totalPages as number) || 1,
      pendingCount: d.pendingCount as number,
    }
  }
  return { data: [], total: 0, totalPages: 1, pendingCount: 0 }
}

export default function AdminSubscriptionsPage() {
  const [rows, setRows] = useState<SubscriptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [current, setCurrent] = useState<SubscriptionRow | null>(null)
  const [decision, setDecision] = useState<Decision>('PAID')
  const [note, setNote] = useState('')
  const [updating, setUpdating] = useState(false)

  const [view, setView] = useState<SubscriptionView>('requests')
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [memberRow, setMemberRow] = useState<SubscriptionRow | null>(null)
  const [memberAction, setMemberAction] = useState<MemberAction>('EXTEND')
  const [memberDays, setMemberDays] = useState(30)
  const [memberNote, setMemberNote] = useState('')
  const [memberSaving, setMemberSaving] = useState(false)

  async function refreshRows() {
    setLoading(true)
    try {
      const r = await getSubscriptionRows(page, statusFilter, view)
      setRows(r.data)
      setTotal(r.total)
      setTotalPages(r.totalPages)
      setPendingCount(r.pendingCount)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => {
    let cancelled = false
    getSubscriptionRows(page, statusFilter, view)
      .then((r) => {
        if (cancelled) return
        setRows(r.data)
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
  }, [page, statusFilter, view])

  function openModal(row: SubscriptionRow) {
    setCurrent(row)
    setDecision(row.status === 'PENDING' ? 'PAID' : row.status === 'PAID' ? 'PAID' : 'REJECTED')
    setNote(row.adminNote || '')
    setDialogOpen(true)
  }

  async function submit() {
    if (!current) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/subscriptions/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: decision, adminNote: note }),
      })
      const d = await res.json()
      if (d.success) {
        setDialogOpen(false)
        setCurrent(null)
        refreshRows()
      } else {
        alert(d.error || 'فشل التحديث')
      }
    } catch (e) { console.error(e); alert('خطأ في الاتصال') } finally { setUpdating(false) }
  }

  function openMemberModal(row: SubscriptionRow, action: MemberAction) {
    setMemberRow(row)
    setMemberAction(action)
    setMemberDays(30)
    setMemberNote('')
    setMemberDialogOpen(true)
  }

  async function submitMembership() {
    if (!memberRow) return
    setMemberSaving(true)
    try {
      const res = await fetch('/api/admin/subscriptions/membership', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: memberRow.userId,
          action: memberAction,
          days: memberAction === 'REVOKE' ? undefined : memberDays,
          note: memberNote,
        }),
      })
      const d = await res.json()
      if (d.success) {
        setMemberDialogOpen(false)
        setMemberRow(null)
        refreshRows()
      } else {
        alert(d.error || 'فشل التحديث')
      }
    } catch (e) { console.error(e); alert('خطأ في الاتصال') } finally { setMemberSaving(false) }
  }

  function handleStatusFilterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLoading(true)
    setStatusFilter(e.target.value)
    setPage(1)
  }

  function handleViewChange(next: SubscriptionView) {
    setLoading(true)
    setView(next)
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
        <DashboardHeader title="اشتراكات الخطط" subtitle={`${total} اشتراك — ${pendingCount} قيد الانتظار`} />

        <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => handleViewChange('requests')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${view === 'requests' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            طلبات الاشتراك ({pendingCount} معلّق)
          </button>
          <button
            onClick={() => handleViewChange('active')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${view === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            المشتركون النشطون ({total})
          </button>
        </div>

        <Modal open={memberDialogOpen} onClose={() => { setMemberDialogOpen(false); setMemberRow(null) }} title="إدارة اشتراك مباشرة" size="md">
          {memberRow && (
            <div className="space-y-4">
              <div className="text-sm space-y-1 bg-gray-50 rounded-lg p-3">
                <p><strong>المستخدم:</strong> #{memberRow.memberNo ?? '—'} {memberRow.name} ({memberRow.email})</p>
                <p><strong>الخطة الحالية:</strong> برو — يتبقى {(memberRow.daysLeft ?? -1) >= 0 ? `${memberRow.daysLeft} يوم` : 'اشتراك مستمر'}</p>
              </div>

              <Select
                label="الإجراء"
                value={memberAction}
                onChange={e => setMemberAction(e.target.value as MemberAction)}
                options={[
                  { value: 'ACTIVATE', label: 'تفعيل فوري (يبدأ من الآن)' },
                  { value: 'EXTEND', label: 'تمديد (يمتد من تاريخ الانتهاء الحالي)' },
                  { value: 'REVOKE', label: 'إيقاف الاشتراك' },
                ]}
              />

              {memberAction !== 'REVOKE' && (
                <Input label={`المدة (بالأيام)`} type="number" min={1} value={memberDays} onChange={e => setMemberDays(parseInt(e.target.value) || 30)} />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ملاحظة (تصل للمستخدم)</label>
                <textarea
                  value={memberNote}
                  onChange={e => setMemberNote(e.target.value)}
                  placeholder={memberAction === 'REVOKE' ? 'مثال: مخالفة شروط الاستخدام.' : 'مثال: تفعيل مكافأة من الإدارة.'}
                  className="w-full h-20 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => { setMemberDialogOpen(false); setMemberRow(null) }}>إلغاء</Button>
                <Button type="button" variant={memberAction === 'REVOKE' ? 'danger' : 'success'} onClick={submitMembership} loading={memberSaving}>
                  {memberAction === 'ACTIVATE' ? 'تفعيل' : memberAction === 'EXTEND' ? 'تمديد' : 'إيقاف الاشتراك'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        <Modal open={dialogOpen} onClose={() => { setDialogOpen(false); setCurrent(null) }} title="معالجة الاشتراك" size="md">
          {current && (
            <div className="space-y-4">
              <div className="text-sm space-y-2 bg-gray-50 rounded-lg p-3">
                <p><strong>المستخدم:</strong> #{current.user?.memberNo ?? '—'} {current.user?.name} ({current.user?.email})</p>
                <p><strong>الخطة:</strong> برو — {formatCurrency(current.amount || 0)} دج (شهر)</p>
                <p><strong>طريقة الدفع:</strong> {current.paymentMethod}</p>
                {current.reference && <p><strong>رقم التحويل:</strong> <span className="font-mono">{current.reference}</span></p>}
                <p><strong>التاريخ:</strong> {new Date(current.createdAt).toLocaleString('ar-DZ-u-nu-latn')}</p>
              </div>

              <Select
                label="القرار"
                value={decision}
                onChange={e => setDecision(e.target.value as Decision)}
                options={[
                  { value: 'PAID', label: 'تأكيد الدفع وتفعيل الخطة' },
                  { value: 'REJECTED', label: 'رفض الطلب' },
                ]}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ملاحظة (تصل للمستخدم)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={decision === 'PAID' ? 'مثال: تم تأكيد الدفع وتفعيل الخطة.' : 'مثال: رقم التحويل غير صحيح، راجع البيانات.'}
                  className="w-full h-24 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setCurrent(null) }}>إلغاء</Button>
                <Button type="button" variant={decision === 'PAID' ? 'success' : 'danger'} onClick={submit} loading={updating}>
                  {decision === 'PAID' ? 'تأكيد وتفعيل' : 'رفض الطلب'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center">
              {view === 'requests' ? (
                <Select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  options={[{ value: '', label: '— كل الحالات —' }, ...Object.entries(statusMap).map(([v, s]) => ({ value: v, label: s.label }))]}
                  className="w-48"
                />
              ) : (
                <p className="text-sm text-gray-500">قائمة المبدعين المشتركين حاليًا في خطة برو.</p>
              )}
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
                        {view === 'requests' ? (
                          <>
                            <th className="px-4 py-3 font-medium">العضو</th>
                            <th className="px-4 py-3 font-medium">المبلغ</th>
                            <th className="px-4 py-3 font-medium">رقم التحويل</th>
                            <th className="px-4 py-3 font-medium">الحالة</th>
                            <th className="px-4 py-3 font-medium">التاريخ</th>
                            <th className="px-4 py-3 font-medium">إجراءات</th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-3 font-medium">العضو</th>
                            <th className="px-4 py-3 font-medium">الخطة</th>
                            <th className="px-4 py-3 font-medium">ينتهي في</th>
                            <th className="px-4 py-3 font-medium">متبقي</th>
                            <th className="px-4 py-3 font-medium">إجراءات</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(r => view === 'requests' ? (
                        <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              <span className="font-mono text-gray-400 ml-1">#{r.user?.memberNo ?? '·'}</span>
                              {r.user?.name || '—'}
                            </div>
                            <span className="block text-xs text-gray-400">{r.user?.email}</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(r.amount || 0)} دج</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">{r.reference || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusMap[r.status]?.cls}`}>
                              {statusMap[r.status]?.label || r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString('ar-DZ-u-nu-latn')}</td>
                          <td className="px-4 py-3">
                            <Button size="sm" variant="outline" onClick={() => openModal(r)}>معالجة</Button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              <span className="font-mono text-gray-400 ml-1">#{r.memberNo ?? '·'}</span>
                              {r.name || '—'}
                            </div>
                            <span className="block text-xs text-gray-400">{r.email}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">PRO</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {r.planExpiresAt ? new Date(r.planExpiresAt).toLocaleDateString('ar-DZ-u-nu-latn') : 'مستمر'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{(r.daysLeft ?? -1) >= 0 ? `${r.daysLeft} يوم` : '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              <Button size="sm" variant="outline" onClick={() => openMemberModal(r, 'EXTEND')}>تمديد</Button>
                              <Button size="sm" variant="outline" onClick={() => openMemberModal(r, 'ACTIVATE')}>تفعيل</Button>
                              <Button size="sm" variant="danger" onClick={() => openMemberModal(r, 'REVOKE')}>إيقاف</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0 && (
                        <tr><td colSpan={view === 'requests' ? 6 : 5} className="px-4 py-10 text-center text-sm text-gray-400">لا توجد بيانات</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {view === 'requests' && totalPages > 1 && (
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
