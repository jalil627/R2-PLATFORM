'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const MESSAGES: Record<string, { title: string; hint: string }> = {
  AccessDenied: {
    title: 'تم رفض تسجيل الدخول',
    hint: 'قد يكون حسابك موقوفًا أو غير مفعّل، أو لم تؤكد Google بريدك. تواصل مع الدعم إذا تكرر الأمر.',
  },
  OAuthAccountNotLinked: {
    title: 'هذا البريد مسجل بطريقة أخرى',
    hint: 'سجل الدخول بالطريقة الأصلية (كلمة المرور) ثم اربط حساب Google من إعدادات حسابك.',
  },
  OAuthCallback: {
    title: 'تعذر إتمام تسجيل الدخول',
    hint: 'حدث خطأ أثناء العودة من Google. حاول مرة أخرى.',
  },
  Configuration: {
    title: 'خلل في إعدادات الدخول',
    hint: 'تواصل مع إدارة المنصة — هناك مشكلة في إعدادات المصادقة.',
  },
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('error') || ''
  const message = MESSAGES[code] || {
    title: 'خطأ في المصادقة',
    hint: 'حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.',
  }

  return (
    <div className="text-center max-w-md">
      <p className="overline-label inline-flex items-center gap-2 justify-center mb-4 text-[11px] font-semibold text-[var(--primary-strong)]">
        <span className="h-px w-6 bg-[var(--a-500)]" />
        R2 · AUTH
        <span className="h-px w-6 bg-[var(--a-500)]" />
      </p>
      <div className="w-16 h-16 rounded-full bg-[var(--primary-soft)] flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-[var(--primary-strong)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="display-tight text-2xl font-bold text-[var(--ink)] mb-2">{message.title}</h1>
      <p className="text-gray-500 mb-6">{message.hint}</p>
      <Link href="/auth/login" className="inline-flex px-6 py-3 rounded-xl brand-gradient text-white font-bold shadow-[0_10px_24px_-10px_rgba(37,78,219,0.7)] transition-all hover:brightness-110">العودة لتسجيل الدخول</Link>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--ink)] px-4">
      <Suspense fallback={null}>
        <AuthErrorContent />
      </Suspense>
    </div>
  )
}
