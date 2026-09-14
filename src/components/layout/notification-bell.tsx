'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

interface Notif {
  id: string
  title: string
  message: string
  link?: string | null
  isRead: boolean
  createdAt: string
}

interface NotificationsPayload {
  items: Notif[]
  unread: number
}

async function fetchNotifications(): Promise<NotificationsPayload> {
  const res = await fetch('/api/notifications', { cache: 'no-store' })
  const json = await res.json() as { success?: boolean; data?: Notif[] }
  if (json.success && Array.isArray(json.data)) {
    const items = json.data
    return { items, unread: items.filter((n) => !n.isRead).length }
  }
  return { items: [], unread: 0 }
}

function timeAgo(iso: string, now: number) {
  const diff = now - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'الآن'
  if (m < 60) return `منذ ${m} دقيقة`
  const h = Math.floor(m / 60)
  if (h < 24) return `منذ ${h} ساعة`
  const d = Math.floor(h / 24)
  if (d < 30) return `منذ ${d} يوم`
  return new Date(iso).toLocaleDateString('ar-DZ-u-nu-latn')
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchNotifications()
      setItems(data.items)
      setUnread(data.unread)
    } catch {}
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchNotifications()
      .then((data) => {
        if (!cancelled) {
          setItems(data.items)
          setUnread(data.unread)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now())
    }, 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  async function markAll() {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
    } catch {}
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnread(0)
  }

  async function markRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [id] }),
      })
    } catch {}
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    setUnread((u) => Math.max(0, u - 1))
  }

  function timeAgoLocal(iso: string) {
    return timeAgo(iso, now)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o)
          if (!open && !items.length) load()
        }}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        aria-label="الإشعارات"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 max-w-[90vw] rounded-2xl bg-white border border-gray-200 shadow-xl shadow-gray-900/10 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">الإشعارات</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs font-medium text-blue-700 hover:underline">
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm text-gray-500">لا توجد إشعارات بعد</p>
              </div>
            ) : (
              items.map((n) => {
                const body = (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${n.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>{n.title}</p>
                      {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[11px] text-gray-400 mt-1">{timeAgoLocal(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                  </>
                )
                return (
                  <div key={n.id}>
                    {n.link ? (
                      <LinkPrefetch href={n.link} onClick={() => markRead(n.id)} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${n.isRead ? '' : 'bg-blue-50/50'}`}>
                        {body}
                      </LinkPrefetch>
                    ) : (
                      <div onClick={() => markRead(n.id)} className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${n.isRead ? '' : 'bg-blue-50/50'}`}>
                        {body}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function LinkPrefetch({ href, onClick, className, children }: { href: string; onClick: () => void; className: string; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  )
}