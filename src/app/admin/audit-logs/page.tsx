'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Select from '@/components/ui/select'

interface AuditLogUser {
  name?: string | null
  email?: string | null
}

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId?: string | null
  oldValues?: unknown
  newValues?: unknown
  ipAddress?: string | null
  createdAt: string
  user?: AuditLogUser | null
}

interface AuditLogListResult {
  data: AuditLog[]
  total: number
  totalPages: number
}

async function getAuditLogs(page: number, search: string, entityFilter: string): Promise<AuditLogListResult> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: '30',
    q: search,
    ...(entityFilter && { entity: entityFilter }),
  })
  const res = await fetch(`/api/admin/audit-logs?${params}`)
  const data = await res.json()
  if (data.success) {
    return {
      data: data.data as AuditLog[],
      total: data.total as number,
      totalPages: data.totalPages as number,
    }
  }
  return { data: [], total: 0, totalPages: 1 }
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let cancelled = false
    getAuditLogs(page, search, entityFilter)
      .then((r) => {
        if (cancelled) return
        setLogs(r.data)
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
  }, [page, search, entityFilter])

  function formatValues(v: unknown) {
    if (!v) return '—'
    try {
      const parsed: unknown = typeof v === 'string' ? JSON.parse(v) : v
      if (typeof parsed !== 'object' || parsed === null) return String(v)
      const keys = Object.keys(parsed as Record<string, unknown>)
      if (keys.length === 0) return '—'
      return keys.map((k) => `${k}: ${JSON.stringify((parsed as Record<string, unknown>)[k])}`).join('، ')
    } catch {
      return String(v)
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLoading(true)
    setSearch(e.target.value)
    setPage(1)
  }

  function handleEntityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLoading(true)
    setEntityFilter(e.target.value)
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
        <DashboardHeader title="سجل المراجعة" subtitle={`${total} حدث`} />

        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4">
              <Input
                placeholder="ابحث بالفعل أو المستخدم..."
                value={search}
                onChange={handleSearchChange}
                className="max-w-xs flex-1"
              />
              <Select
                value={entityFilter}
                onChange={handleEntityChange}
                options={[
                  { value: '', label: '— كل الكيانات —' },
                  { value: 'PRODUCT', label: 'منتج' },
                  { value: 'USER', label: 'مستخدم' },
                  { value: 'ORDER', label: 'طلب' },
                  { value: 'REVIEW', label: 'تقييم' },
                  { value: 'CATEGORY', label: 'تصنيف' },
                  { value: 'COUPON', label: 'كوبون' },
                  { value: 'PAYOUT', label: 'سحب' },
                  { value: 'REPORT', label: 'بلاغ' },
                ]}
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
                        <th className="px-4 py-3 font-medium">التاريخ</th>
                        <th className="px-4 py-3 font-medium">المستخدم</th>
                        <th className="px-4 py-3 font-medium">الفعل</th>
                        <th className="px-4 py-3 font-medium">الكيان</th>
                        <th className="px-4 py-3 font-medium">معرّف الكيان</th>
                        <th className="px-4 py-3 font-medium">التغيير</th>
                        <th className="px-4 py-3 font-medium">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString('ar-DZ-u-nu-latn')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {log.user?.name || '—'}
                            <span className="block text-xs text-gray-400">{log.user?.email}</span>
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-xs bg-gray-100 text-blue-700 px-2 py-0.5 rounded">{log.action}</code>
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-gray-700">{log.entity}</td>
                          <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.entityId || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-[280px]">
                            {Boolean(log.oldValues || log.newValues) && (
                              <div className="space-y-0.5">
                                {Boolean(log.oldValues) && <p className="text-blue-400 line-clamp-1"><span className="font-medium">قبل:</span> {formatValues(log.oldValues)}</p>}
                                {Boolean(log.newValues) && <p className="text-emerald-500 line-clamp-1"><span className="font-medium">بعد:</span> {formatValues(log.newValues)}</p>}
                              </div>
                            )}
                            {!log.oldValues && !log.newValues && '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.ipAddress || '—'}</td>
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
