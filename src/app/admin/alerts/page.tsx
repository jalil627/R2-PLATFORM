'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Alert {
  id: string
  severity: string
  title: string
  message: string
  link?: string | null
  isRead: boolean
  createdAt: string
}

const SEVERITY: Record<string, { label: string; variant: 'default' | 'warning' | 'danger' | 'info' | 'success' }> = {
  critical: { label: 'حرج', variant: 'danger' },
  warning: { label: 'تحذير', variant: 'warning' },
  info: { label: 'معلومة', variant: 'info' },
}

async function fetchAlerts(page: number, severity: string, unread: boolean) {
  const params = new URLSearchParams({ page: String(page), pageSize: '20' })
  if (severity) params.set('severity', severity)
  if (unread) params.set('unread', '1')
  const res = await fetch(`/api/admin/alerts?${params}`)
  return res.json()
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)
  const [severity, setSeverity] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)

  function load() {
    setLoading(true)
    fetchAlerts(page, severity, unreadOnly)
      .then((d) => {
        if (d?.success) {
          setAlerts(d.data.alerts as Alert[])
          setTotalPages(d.data.totalPages)
          setUnreadCount(d.data.unreadCount)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    fetchAlerts(page, severity, unreadOnly)
      .then((d) => {
        if (cancelled || !d?.success) return
        setAlerts(d.data.alerts as Alert[])
        setTotalPages(d.data.totalPages)
        setUnreadCount(d.data.unreadCount)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, severity, unreadOnly])

  function markRead(id?: string, all?: boolean) {
    fetch('/api/admin/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(all ? { all: true } : { id }),
    })
      .then(() => load())
      .catch(() => {})
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader
          title="تنبيهات النظام"
          subtitle={unreadCount > 0 ? `${unreadCount} غير مقروء` : 'كل التنبيهات مقروءة'}
          actions={
            unreadCount > 0 ? (
              <Button variant="outline" onClick={() => markRead(undefined, true)}>تعليم الكل كمقروء</Button>
            ) : undefined
          }
        />

        <Card className="mb-4">
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { v: '', l: 'الكل' },
                { v: 'critical', l: 'حرج' },
                { v: 'warning', l: 'تحذير' },
                { v: 'info', l: 'معلومة' },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => { setSeverity(o.v); setPage(1) }}
                  className={`px-4 h-9 rounded-full text-sm font-bold border transition-colors ${severity === o.v ? 'brand-gradient text-white border-transparent' : 'border-gray-300 text-gray-600 hover:border-[var(--a-400)]'}`}
                >
                  {o.l}
                </button>
              ))}
              <button
                onClick={() => { setUnreadOnly(!unreadOnly); setPage(1) }}
                className={`px-4 h-9 rounded-full text-sm font-bold border transition-colors ${unreadOnly ? 'bg-amber-400 text-[#0b1026] border-transparent' : 'border-gray-300 text-gray-600 hover:border-[var(--a-400)]'}`}
              >
                غير المقروء فقط
              </button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card><CardContent><div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div></CardContent></Card>
        ) : alerts.length === 0 ? (
          <Card><CardContent><p className="text-center text-gray-500 py-12">لا توجد تنبيهات — النظام يعمل بهدوء.</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => {
              const s = SEVERITY[a.severity] || SEVERITY.info
              return (
                <Card key={a.id} className={!a.isRead ? 'border-[var(--a-300)]' : ''}>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={s.variant}>{s.label}</Badge>
                          {!a.isRead && <span className="w-2 h-2 rounded-full bg-[var(--a-500)]" />}
                          <p className="font-bold text-gray-900">{a.title}</p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{a.message}</p>
                        <p className="text-xs text-gray-400 mt-1.5 tabular-nums">{new Date(a.createdAt).toLocaleString('ar-DZ')}</p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {a.link && <a href={a.link} className="text-xs font-bold text-[var(--primary-strong)] hover:underline">فتح</a>}
                        {!a.isRead && (
                          <button onClick={() => markRead(a.id)} className="text-xs font-bold text-gray-400 hover:text-emerald-600 transition-colors">مقروء</button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>السابق</Button>
            <span className="text-xs text-gray-500 tabular-nums">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>التالي</Button>
          </div>
        )}
      </main>
    </div>
  )
}
