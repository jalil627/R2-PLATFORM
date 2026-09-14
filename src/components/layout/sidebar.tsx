'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { canAccessSection } from '@/lib/admin-sections'

const PRO_SEGMENTS = ['/creator/analytics', '/creator/coupons', '/creator/affiliates']

interface SidebarLink {
  label: string
  href: string
  icon: string
  /** Admin section key — links with a section are hidden from roles lacking it. */
  section?: string
}

interface SidebarProps {
  user?: { name: string; email: string; role: string; avatar: string | null }
  links: SidebarLink[]
  title: string
}

const iconPaths: Record<string, string> = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  products: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  orders: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  customers: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  analytics: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  earnings: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  coupons: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
  payouts: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  reports: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
  categories: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  affiliate: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  reviews: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.119l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.56-1.838-.197-1.538-1.119l1.518-4.674a1 1 0 00-.363-1.118L2.976 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.673z',
  complaints: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  subscriptions: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  broadcast: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
  audit: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  alert: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  treasury: 'M3 8h18v3H3zM5 8V6a2 2 0 012-2h10a2 2 0 012 2v2m-9 5h4m-6 5h8a2 2 0 002-2v-4H5v4a2 2 0 002 2z',
  store: 'M3 7l9-4 9 4M3 7v11a2 2 0 002 2h14a2 2 0 002-2V7M3 7l2-4m16 4l-2-4M9 20v-5a2 2 0 012-2h2a2 2 0 012 2v5',
}

const roleLabel = (role: string) =>
  role === 'SUPER_ADMIN' ? 'مدير عام'
    : role === 'ADMIN' ? 'مدير'
      : role === 'CREATOR' ? 'مبدع'
        : 'عضو'

export default function Sidebar({ user, links, title }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [me, setMe] = useState(user)
  const [meFailed, setMeFailed] = useState(false)
  const [isPro, setIsPro] = useState<boolean | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (user) return
    let cancelled = false
    let tries = 0
    const load = () => {
      fetch('/api/me')
        .then(r => r.json())
        .then(d => {
          if (cancelled) return
          if (d?.data) {
            setMe(d.data)
          } else if (tries < 1) {
            tries += 1
            setTimeout(load, 1500)
          } else {
            setMeFailed(true)
          }
        })
        .catch(() => {
          if (cancelled) return
          if (tries < 1) {
            tries += 1
            setTimeout(load, 1500)
          } else {
            setMeFailed(true)
          }
        })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    let alive = true
    fetch('/api/creator/plans')
      .then(r => r.json())
      .then(d => { if (alive) setIsPro(!!d?.data?.isPro) })
      .catch(() => { if (alive) setIsPro(true) })
    return () => { alive = false }
  }, [])

  const displayName = me?.name || 'مستخدم'
  const displayEmail = me?.email || ''

  // Role-scoped navigation: section links render only for authorized roles.
  // Links without a section always render (creator/buyer menus).
  // While the session loads we show skeleton rows — never a blank nav.
  const loadingMe = !user && !me && !meFailed
  const visibleLinks = links.filter((link) => !link.section || (me?.role && canAccessSection(me.role, link.section)))
  const showRoleNotice = !loadingMe && links.some((link) => link.section) && visibleLinks.length === 0

  const navItem = (link: SidebarLink, onNavigate?: () => void) => {
    const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
    const isProItem = PRO_SEGMENTS.includes(link.href)
    const locked = isProItem && isPro === false
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => {
          onNavigate?.()
          if (locked) router.push('/creator/plans')
        }}
        className={cn(
          'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-[var(--primary-soft)] text-[var(--primary-strong)]'
            : locked
              ? 'text-gray-400 cursor-not-allowed hover:bg-black/5'
              : 'text-gray-600 hover:bg-black/5 hover:text-[var(--ink)]'
        )}
      >
        <span className={cn('absolute right-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full transition-opacity duration-200', isActive ? 'bg-[var(--a-500)] opacity-100' : 'opacity-0 group-hover:opacity-40')} />
        <svg className={cn('w-5 h-5 flex-shrink-0 transition-colors', isActive ? 'text-[var(--primary-strong)]' : 'text-gray-400 group-hover:text-gray-600')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPaths[link.icon] || iconPaths.dashboard} />
        </svg>
        <span className="flex-1">{link.label}</span>
        {locked && (
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )}
      </Link>
    )
  }

  const brandBlock = (
    <div className="flex items-center gap-2.5 px-3">
      <div className="relative h-9 w-9 rounded-xl brand-gradient flex items-center justify-center shadow-lg shadow-[var(--a-600)]/30">
        <span className="text-white font-bold text-sm tracking-tight">R2</span>
        <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-[var(--gold)] border-2 border-white" />
      </div>
      <div className="leading-none min-w-0">
        <p className="text-sm font-extrabold tracking-tight text-[var(--ink)]">R2 <span className="brand-text">PLATFORM</span></p>
        <p className="mt-1 overline-label text-[9px] text-gray-400 truncate">{title}</p>
      </div>
    </div>
  )

  const userChip = (
    <div className="flex items-center gap-2.5 px-3 py-2.5 mx-1 rounded-xl border border-gray-200/80 bg-white/60">
      <Avatar name={displayName || displayEmail} src={me?.avatar || null} size="md" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-[var(--ink)] truncate">{displayName}</p>
        <p className="text-[11px] text-gray-500 truncate">{displayEmail}</p>
      </div>
      {me?.role && (
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold overline-label bg-[var(--primary-soft)] text-[var(--primary-strong)]">
          {roleLabel(me.role)}
        </span>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile top bar + drawer */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-2 px-4 h-14 bg-white/90 backdrop-blur border-b border-gray-200">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="فتح القائمة"
          className="inline-flex items-center gap-2 text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" /></svg>
          <span className="font-bold text-[var(--ink)]">{title}</span>
        </button>
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col overflow-y-auto border-l border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              {brandBlock}
              <button onClick={() => setMobileOpen(false)} aria-label="إغلاق" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mt-3">{userChip}</div>
            <nav className="p-3 space-y-1 flex-1 mt-2">
              {loadingMe ? (
                <div className="space-y-2 px-1" aria-label="جاري تحميل القائمة">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                visibleLinks.map((link) => navItem(link, () => setMobileOpen(false)))
              )}
              {showRoleNotice && (
                <div className="mx-1 mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 leading-relaxed">
                  لا توجد أقسام متاحة لحسابك الحالي{meFailed ? ' (تعذر تحميل الجلسة)' : ''} — تأكد من تسجيل الدخول بالحساب الصحيح أو تواصل مع المدير العام.
                </div>
              )}
            </nav>
            <div className="p-3 border-t border-gray-200 space-y-1">
              <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--primary-strong)] hover:bg-[var(--primary-soft)] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                الرئيسية
              </Link>
              <Link href="/marketplace" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--primary-strong)] hover:bg-[var(--primary-soft)] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                العودة إلى السوق
              </Link>
            </div>
          </div>
        </div>
      )}

      <aside className="w-64 min-h-screen bg-[var(--surface)] border-l border-gray-200/80 hidden lg:flex lg:flex-col">
        <div className="p-4 flex flex-col flex-1">
          <div className="mb-5 pt-2">{brandBlock}</div>

          <div className="mb-6">{userChip}</div>

          <nav className="space-y-1 flex-1">
            {loadingMe ? (
              <div className="space-y-2 px-1" aria-label="جاري تحميل القائمة">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              visibleLinks.map((link) => navItem(link))
            )}
            {showRoleNotice && (
              <div className="mx-1 mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 leading-relaxed">
                لا توجد أقسام متاحة لحسابك الحالي{meFailed ? ' (تعذر تحميل الجلسة)' : ''} — تأكد من تسجيل الدخول بالحساب الصحيح أو تواصل مع المدير العام.
              </div>
            )}
          </nav>

          <div className="mt-6 pt-4 border-t border-gray-200/80 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[var(--primary-strong)] hover:bg-[var(--primary-soft)] transition-colors"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              الرئيسية
            </Link>
            <Link
              href="/marketplace"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[var(--primary-strong)] hover:bg-[var(--primary-soft)] transition-colors"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              العودة إلى السوق
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}