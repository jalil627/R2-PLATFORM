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

const statusOptions = [
  { value: 'PENDING', label: 'قيد الانتظار', variant: 'default' as const },
  { value: 'PROCESSING', label: 'قيد المعالجة', variant: 'info' as const },
  { value: 'PAID', label: 'مدفوع', variant: 'success' as const },
  { value: 'FAILED', label: 'فشل', variant: 'danger' as const },
  { value: 'REFUNDED', label: 'مسترد', variant: 'warning' as const },
  { value: 'CANCELLED', label: 'ملغي', variant: 'default' as const },
]

const statusMap = Object.fromEntries(statusOptions.map(s => [s.value, s]))

function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] || { label: status, variant: 'default' }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

function Icon({ path, className = 'w-5 h-5' }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

interface OrderUser {
  name?: string | null
  email?: string | null
}

interface OrderSeller {
  user?: OrderUser | null
}

interface OrderItemProduct {
  title?: string | null
}

interface OrderItem {
  id: string
  quantity: number
  product?: OrderItemProduct | null
}

interface OrderPayment {
  provider?: string | null
  status?: string | null
}

interface AdminOrder {
  id: string
  orderNumber: string
  status: string
  grossAmount: number
  currency: string
  createdAt: string
  buyer?: OrderUser | null
  seller?: OrderSeller | null
  items?: OrderItem[] | null
  payment?: OrderPayment | null
}

interface OrderListResult {
  data: AdminOrder[]
  total: number
  totalPages: number
}

async function getOrders(page: number, search: string, statusFilter: string): Promise<OrderListResult> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: '20',
    q: search,
    ...(statusFilter && { status: statusFilter }),
  })
  const res = await fetch(`/api/admin/orders?${params}`)
  const data = await res.json()
  if (data.success) {
    return {
      data: data.data as AdminOrder[],
      total: data.total as number,
      totalPages: data.totalPages as number,
    }
  }
  return { data: [], total: 0, totalPages: 1 }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [updating, setUpdating] = useState(false)

  async function refreshOrders() {
    setLoading(true)
    try {
      const r = await getOrders(page, search, statusFilter)
      setOrders(r.data)
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
    getOrders(page, search, statusFilter)
      .then((r) => {
        if (cancelled) return
        setOrders(r.data)
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

  function openStatusModal(order: AdminOrder) {
    setSelectedOrder(order)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setSelectedOrder(null)
  }

  async function handleStatusChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedOrder) return
    setUpdating(true)
    try {
      const formData = new FormData(e.currentTarget)
      const status = formData.get('status')
      const notes = formData.get('notes')
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: notes || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        closeDialog()
        refreshOrders()
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

  function handleStatusFilterChange(e: React.ChangeEvent<HTMLSelectElement>) {
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
    ...statusOptions.map(s => ({ value: s.value, label: s.label })),
  ]

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <DashboardHeader title="إدارة الطلبات" subtitle={`${total} طلب`} />
        </div>

        <Modal open={dialogOpen} onClose={closeDialog} title="تحديث حالة الطلب" size="md">
          {selectedOrder && (
            <form onSubmit={handleStatusChange} className="space-y-4">
              <div className="text-sm text-gray-500 space-y-1">
                <p><strong>الطلب:</strong> {selectedOrder.orderNumber}</p>
                <p><strong>المشتري:</strong> {selectedOrder.buyer?.name || '—'} ({selectedOrder.buyer?.email || '—'})</p>
                <p><strong>المبلغ:</strong> {formatCurrency(selectedOrder.grossAmount)} {selectedOrder.currency}</p>
              </div>
              <Select
                label="الحالة الجديدة"
                value={selectedOrder.status}
                onChange={e => setSelectedOrder({ ...selectedOrder, status: e.target.value })}
                options={statusOptions.map(s => ({ value: s.value, label: s.label }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ملاحظات (اختياري)</label>
                <textarea
                  name="notes"
                  className="w-full h-20 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="ملاحظات إضافية..."
                />
              </div>
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
                placeholder="ابحث برقم الطلب، المشتري، أو البائع..."
                value={search}
                onChange={handleSearchChange}
                className="max-w-xs flex-1"
              />
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
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
                        <th className="px-4 py-3 font-medium">الطلب</th>
                        <th className="px-4 py-3 font-medium">المشتري</th>
                        <th className="px-4 py-3 font-medium">البائع</th>
                        <th className="px-4 py-3 font-medium">المنتجات</th>
                        <th className="px-4 py-3 font-medium">المبلغ</th>
                        <th className="px-4 py-3 font-medium">الحالة</th>
                        <th className="px-4 py-3 font-medium">الدفع</th>
                        <th className="px-4 py-3 font-medium">التاريخ</th>
                        <th className="px-4 py-3 font-medium">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900 font-mono">{order.orderNumber}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{order.buyer?.name || '—'}</span>
                            <br />
                            <span className="text-xs text-gray-500">{order.buyer?.email || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{order.seller?.user?.name || '—'}</span>
                            <br />
                            <span className="text-xs text-gray-500">{order.seller?.user?.email || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            {order.items?.map((item) => (
                              <span key={item.id} className="text-sm text-gray-900 block truncate max-w-xs">
                                {item.product?.title || 'منتج'} × {item.quantity}
                              </span>
                            ))}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {formatCurrency(order.grossAmount)} {order.currency}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                          <td className="px-4 py-3">
                            {order.payment?.provider && (
                              <Badge variant={order.payment.status === 'COMPLETED' ? 'success' : 'default'}>
                                {order.payment.provider}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('ar-DZ-u-nu-latn')}
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="icon" onClick={() => openStatusModal(order)}>
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
