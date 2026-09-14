'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import AuthShell from '@/components/auth/auth-shell'

function ResetPassword() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const d = await res.json()
      if (d.success) setMessage(d.message || 'تم التغيير')
      else setError(d.error || 'حدث خطأ ما')
    } catch {
      setError('حدث خطأ ما')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="إعادة تعيين كلمة المرور"
      subtitle="اختر كلمة مرور جديدة وقوية لحسابك"
      brandTitle={<>كلمة جديدة، <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 via-amber-400 to-orange-400">بداية آمنة.</span></>}
      brandDesc="خطوة واحدة تفصلك عن العودة إلى متجرك ومنتجاتك وأرباحك."
      footer={<Link href="/auth/login" className="text-[var(--primary-strong)] hover:text-[var(--primary)] font-bold transition-colors">العودة لتسجيل الدخول</Link>}
    >
      {message ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-start gap-2.5">
            <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm text-emerald-700 font-medium">{message}</p>
          </div>
          <Link href="/auth/login" className="block text-center text-[var(--primary-strong)] hover:text-[var(--primary)] font-bold transition-colors">تسجيل الدخول</Link>
        </div>
      ) : !token ? (
        <p className="text-center text-sm text-[var(--primary-strong)] font-medium">رابط غير صالح — مطلوب رمز إعادة التعيين.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div key={error} className="auth-shake p-3.5 rounded-2xl bg-red-50 border border-red-200/70 flex items-start gap-2.5">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}
          <Input
            label="كلمة المرور الجديدة"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="8 أحرف على الأقل"
            className="h-12 rounded-2xl focus:ring-[var(--a-500)] focus:border-[var(--a-500)] transition-shadow"
          />
          <Input
            label="تأكيد كلمة المرور"
            type="password"
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="أعد كتابة كلمة المرور"
            className="h-12 rounded-2xl focus:ring-[var(--a-500)] focus:border-[var(--a-500)] transition-shadow"
          />
          <Button type="submit" loading={loading} className="w-full py-3.5 rounded-2xl brand-gradient text-white font-black text-base shadow-[0_16px_32px_-12px_rgba(37,78,219,0.7)] hover:brightness-110 active:scale-[0.99] transition-all duration-300">تغيير كلمة المرور</Button>
        </form>
      )}
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPassword />
    </Suspense>
  )
}
