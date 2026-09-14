'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const DONE = ['PAID', 'FAILED', 'REFUNDED', 'CANCELLED']

function SuccessContent() {
  const searchParams = useSearchParams()
  const order = searchParams.get('order') || ''
  const failed = searchParams.get('failed') === '1'
  const [status, setStatus] = useState<string | null>(failed ? 'FAILED' : null)
  const [checking, setChecking] = useState(!failed && !!order)
  const count = useRef(0)

  useEffect(() => {
    if (!order || failed) return
    let stopped = false

    const run = async () => {
      try {
        const res = await fetch(`/api/orders/status?order=${encodeURIComponent(order)}&_=${Date.now()}`, { cache: 'no-store' })
        const data = await res.json()
        if (stopped || !data.success) return
        const s: string = data.data?.status
        setStatus(s)
        if (DONE.includes(s)) {
          setChecking(false)
          return
        }
      } catch {
        if (stopped) return
      }
      count.current += 1
      if (count.current >= 10) {
        setChecking(false)
        return
      }
      setTimeout(run, 2500)
    }

    run()
    return () => { stopped = true }
  }, [order, failed])

  const paid = status === 'PAID' || status === 'REFUNDED'
  const isFailed = status === 'FAILED' || status === 'CANCELLED'
  const pending = checking && !paid && !isFailed

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {paid ? (
          <>
            <div className="w-20 h-20 rounded-full brand-gradient flex items-center justify-center mx-auto mb-6 shadow-[0_10px_30px_-10px_rgba(37,78,219,0.8)]">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="overline-label inline-flex items-center gap-2 justify-center mb-3 text-[11px] font-semibold text-emerald-600">
              <span className="h-px w-6 bg-emerald-500" />
              R2 · CHECKOUT
              <span className="h-px w-6 bg-emerald-500" />
            </p>
            <h1 className="display-tight text-2xl sm:text-3xl font-bold text-[var(--ink)] mb-2">تم تأكيد الدفع بنجاح!</h1>
            <p className="text-gray-500 mb-8">شكرًا لك. يمكنك تحميل المنتج من صفحة مشترياتك.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard/purchases" className="px-6 py-3 rounded-xl brand-gradient text-white font-bold shadow-[0_10px_24px_-10px_rgba(37,78,219,0.7)] hover:brightness-110 transition-all">عرض مشترياتي</Link>
              <Link href="/marketplace" className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">العودة للسوق</Link>
            </div>
          </>
        ) : isFailed ? (
          <>
            <div className="w-20 h-20 rounded-full bg-[var(--primary-soft)] flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[var(--primary-strong)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="overline-label inline-flex items-center gap-2 justify-center mb-3 text-[11px] font-semibold text-[var(--primary-strong)]">
              <span className="h-px w-6 bg-[var(--a-500)]" />
              R2 · CHECKOUT
              <span className="h-px w-6 bg-[var(--a-500)]" />
            </p>
            <h1 className="display-tight text-2xl sm:text-3xl font-bold text-[var(--ink)] mb-2">لم يكتمل الدفع</h1>
            <p className="text-gray-500 mb-8">لم يتم خصم أي مبلغ من حسابك. يمكنك المحاولة مرة أخرى.</p>
            <Link href="/marketplace" className="inline-block px-6 py-3 rounded-xl brand-gradient text-white font-bold shadow-[0_10px_24px_-10px_rgba(37,78,219,0.7)] hover:brightness-110 transition-all">العودة للسوق</Link>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-[var(--primary-soft)] flex items-center justify-center mx-auto mb-6">
              <span className="w-8 h-8 border-4 border-[var(--primary-strong)] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="overline-label inline-flex items-center gap-2 justify-center mb-3 text-[11px] font-semibold text-[var(--primary-strong)]">
              <span className="h-px w-6 bg-[var(--a-500)]" />
              R2 · CHECKOUT
              <span className="h-px w-6 bg-[var(--a-500)]" />
            </p>
            <h1 className="display-tight text-2xl sm:text-3xl font-bold text-[var(--ink)] mb-2">
              {pending ? 'في انتظار تأكيد الدفع...' : 'جارٍ التحقق من حالة الدفع'}
            </h1>
            <p className="text-gray-500 mb-2">
              أكمل الدفع عبر بريدك جوال أو بطاقة CIB — سنؤكد طلبك تلقائيًا لحظة وصول التأكيد من البنك.
            </p>
            <p className="text-gray-400 text-sm mb-8">رقم الطلب: {order || '-'}</p>
            <Link href="/dashboard/purchases" className="inline-block px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">عرض مشترياتي</Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  )
}