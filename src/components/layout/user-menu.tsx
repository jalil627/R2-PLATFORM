'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import SmartImage from '@/components/ui/smart-image'

export interface MenuUser {
  name?: string | null
  email?: string | null
  avatar?: string | null
}

interface UserMenuProps {
  user: MenuUser
  dashHref: string
  dashLabel: string
  isAdmin: boolean
}

function MenuItem({ href, onNavigate, icon, children, danger }: { href: string; onNavigate: () => void; icon: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-[var(--primary-soft)] hover:text-[var(--primary-strong)]'
      }`}
    >
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      {children}
    </Link>
  )
}

export default function UserMenu({ user, dashHref, dashLabel, isAdmin }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open ])

  const initial = (user.name || user.email || 'م')[0]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="قائمة الحساب"
        className={`flex items-center gap-2 rounded-full border p-1 pl-1 transition-all ${
          open ? 'border-[var(--a-400)] shadow-[var(--shadow-md)]' : 'border-gray-200 hover:border-gray-300 hover:shadow-[var(--shadow-sm)]'
        } bg-white`}
      >
        <span className="relative w-8 h-8 rounded-full brand-gradient text-white flex items-center justify-center overflow-hidden shrink-0">
          {user.avatar ? (
            <SmartImage src={user.avatar} alt={user.name || 'المستخدم'} className="object-cover" sizes="64px" />
          ) : (
            <span className="text-sm font-black">{initial}</span>
          )}
        </span>
        <span className="hidden xl:block max-w-[7rem] truncate text-sm font-bold text-gray-700 pr-1">{user.name || 'حسابي'}</span>
        <svg className={`w-4 h-4 ml-1 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute left-0 top-full mt-2 w-60 rounded-2xl border border-gray-200 bg-white shadow-[var(--shadow-lg)] p-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100 mb-1.5">
            <p className="text-sm font-extrabold text-[var(--ink)] truncate">{user.name || 'مستخدم'}</p>
            {user.email && <p className="text-xs text-gray-500 truncate mt-0.5" dir="ltr">{user.email}</p>}
          </div>
          <MenuItem href={dashHref} onNavigate={() => setOpen(false)} icon="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z">
            {dashLabel}
          </MenuItem>
          {isAdmin && (
            <MenuItem href="/admin" onNavigate={() => setOpen(false)} icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z">
              الإدارة
            </MenuItem>
          )}
          <MenuItem href="/dashboard/purchases" onNavigate={() => setOpen(false)} icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4">
            مشترياتي
          </MenuItem>
          <div className="h-px bg-gray-100 my-1.5" />
          <MenuItem href="/auth/logout" onNavigate={() => setOpen(false)} danger icon="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1">
            تسجيل الخروج
          </MenuItem>
        </div>
      )}
    </div>
  )
}
