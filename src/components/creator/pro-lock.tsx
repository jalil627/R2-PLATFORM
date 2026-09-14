'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'

export function useProGate() {
  const [state, setState] = useState({ loading: true, isPro: false })
  useEffect(() => {
    let alive = true
    fetch('/api/creator/plans')
      .then(r => r.json())
      .then(d => { if (alive) setState({ loading: false, isPro: !!d?.data?.isPro }) })
      .catch(() => { if (alive) setState({ loading: false, isPro: false }) })
    return () => { alive = false }
  }, [])
  return state
}

export function ProLock({ title = 'هذه الخاصية متاحة في خطة برو' }: { title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-10">
      <div className="w-24 h-24 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-5">
        <svg className="w-12 h-12 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-base text-gray-500 mb-7 max-w-sm">
        رقِّ إلى خطة برو لفتح هذه الخاصية وكشف محتواها بالكامل.
      </p>
      <Link
        href="/creator/plans"
        className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl brand-gradient text-white font-bold text-lg shadow-[0_14px_28px_-12px_rgba(29,78,216,0.55)] hover:brightness-110 hover:scale-[1.02] transition-all"
      >
        الذهاب لتطوير الباقة
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7 7l-7-7 7-7" transform="scale(-1,1) translate(-24,0)" />
        </svg>
      </Link>
    </div>
  )
}

export function ProLocked({
  locked,
  title,
  children,
}: {
  locked: boolean
  title?: string
  children: ReactNode
}) {
  if (!locked) return <>{children}</>
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="blur-[8px] opacity-25 select-none pointer-events-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 bg-white/30" aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center">
        <ProLock title={title} />
      </div>
    </div>
  )
}