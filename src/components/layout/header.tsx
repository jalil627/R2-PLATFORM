'use client'

import Link from 'next/link'
import { useState } from 'react'
import NotificationBell from '@/components/layout/notification-bell'
import UserMenu from '@/components/layout/user-menu'

interface HeaderProps {
  locale?: string
  user?: { name: string; email: string; role: string; avatar: string | null } | null
}

const navItems = [
  { href: '/marketplace', label: 'السوق' },
  { href: '/features', label: 'المميزات' },
  { href: '/pricing', label: 'الأسعار' },
  { href: '/help', label: 'المساعدة' },
]

const navLinkClass =
  'overline-label relative py-2 text-gray-500 hover:text-[var(--ink)] transition-colors after:absolute after:bottom-0 after:right-0 after:h-0.5 after:w-0 after:bg-[var(--a-600)] after:transition-all after:duration-300 hover:after:w-full'

export default function Header({ user }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isCreator = user?.role === 'CREATOR' || user?.role === 'SUPER_ADMIN'
  const dashLabel = isCreator ? 'لوحة المبدع' : 'لوحة التحكم'
  const dashHref = user
    ? isCreator
      ? '/creator/dashboard'
      : isAdmin
        ? '/admin'
        : '/dashboard'
    : '/auth/register'

  return (
    <div>
      <header className="sticky top-0 z-50 w-full bg-white/85 backdrop-blur-xl border-b border-gray-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group justify-self-start">
              <div className="relative h-10 w-10 rounded-xl brand-gradient flex items-center justify-center shadow-lg shadow-[var(--a-600)]/30 transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-base tracking-tight">R2</span>
                <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-[var(--gold)] border-2 border-white" />
              </div>
              <span className="leading-none">
                <span className="block text-lg font-extrabold tracking-tight text-[var(--ink)]">
                  R2 <span className="brand-text">PLATFORM</span>
                </span>
                <span className="block mt-1 overline-label text-[9px] text-gray-400">منصة المبدعين الجزائرية</span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center justify-center gap-7">
              {navItems.map((l) => (
                <Link key={l.href} href={l.href} className={navLinkClass}>
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="hidden lg:flex items-center justify-self-end gap-2.5">
              {user && <NotificationBell />}
              {user && <div className="h-6 w-px bg-gray-200" />}
              {user ? (
                <UserMenu user={user} dashHref={dashHref} dashLabel={dashLabel} isAdmin={isAdmin} />
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 rounded-full text-sm font-semibold text-gray-600 hover:text-[var(--ink)] hover:bg-black/5 transition-colors"
                  >
                    دخول
                  </Link>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold brand-gradient text-white shadow-[0_10px_24px_-10px_rgba(37,78,219,0.7)] hover:brightness-110 hover:-translate-y-0.5 transition-all"
                  >
                    حساب جديد
                    <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>

            <div className="lg:hidden flex items-center justify-self-end gap-1">
              {user && <NotificationBell />}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-lg hover:bg-black/5"
                aria-label="القائمة"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Full-width divider */}
        <div className="h-px w-full bg-gray-200" />

        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-[var(--primary-soft)] hover:text-[var(--primary-strong)]">
                  {l.label}
                </Link>
              ))}
              <div className="border-t border-gray-200 my-2" />
              <p className="px-3 pt-1 pb-1 overline-label text-[10px] text-gray-400">حسابي</p>
              {user ? (
                <>
                  <Link href={dashHref} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-[var(--primary-soft)] hover:text-[var(--primary-strong)]">
                    <span className="w-8 h-8 rounded-full brand-gradient text-white flex items-center justify-center text-sm font-black shrink-0">
                      {(user.name || user.email || 'م')[0]}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate">{user.name || 'حسابي'}</span>
                      <span className="block text-xs font-medium text-gray-400">{dashLabel}</span>
                    </span>
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-black/5">
                      الإدارة
                    </Link>
                  )}
                  <Link href="/dashboard/purchases" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-black/5">
                    مشترياتي
                  </Link>
                  <Link href="/auth/logout" onClick={() => setMobileOpen(false)} className="mt-1 block px-3 py-2 rounded-lg text-center text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100">
                    تسجيل الخروج
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-black/5">
                    دخول
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="mt-1 block px-3 py-2.5 rounded-lg text-center text-sm font-bold brand-gradient text-white shadow-[0_8px_18px_-8px_rgba(37,78,219,0.55)]">
                    حساب جديد
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  )
}