'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl brand-gradient flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(37,78,219,0.8)]">
          <span className="text-white font-bold text-2xl">R2</span>
          <span className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-[var(--gold)] border-2 border-white" />
        </div>
        <p className="overline-label inline-flex items-center gap-2 justify-center mb-3 text-[11px] font-semibold text-[var(--primary-strong)]">
          <span className="h-px w-6 bg-[var(--a-500)]" />
          R2 · ERROR
          <span className="h-px w-6 bg-[var(--a-500)]" />
        </p>
        <h1 className="display-tight text-2xl font-bold text-[var(--ink)] mb-3">حدث خطأ غير متوقع</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          نعتذر عن هذا العطل. جرب إعادة تحميل الصفحة، وإن تكررت المشكلة تواصل معنا لمساعدتك.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl brand-gradient text-white text-sm font-bold hover:brightness-110 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            إعادة المحاولة
          </button>
          <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-100 transition-colors">
            تواصل معنا
          </Link>
        </div>
        {error.digest && <p className="mt-6 text-xs text-gray-400">رمز الخطأ: {error.digest}</p>}
      </div>
    </div>
  )
}