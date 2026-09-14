'use client'

import Link from 'next/link'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  showMobileMenu?: boolean
}

export default function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-5 flex-wrap">
        <Link href="/" className="hover:text-[var(--primary-strong)] inline-flex items-center gap-1 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          الرئيسية
        </Link>
        <span className="text-gray-300">/</span>
        <Link href="/marketplace" className="hover:text-[var(--primary-strong)] transition-colors">السوق</Link>
        <span className="text-gray-300">/</span>
        <span className="text-[var(--ink)] font-medium">{title}</span>
      </nav>
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <span className="ghost-ink text-4xl sm:text-5xl font-extrabold select-none shrink-0" aria-hidden="true">0{title.length.toString()}</span>
          <div className="min-w-0">
            <p className="overline-label mb-1 hidden sm:block">R2 · {title.length > 6 ? 'BACK-OFFICE' : 'PANEL'}</p>
            <h1 className="display-tight text-2xl sm:text-3xl font-bold text-[var(--ink)]">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-1.5 max-w-2xl">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  )
}