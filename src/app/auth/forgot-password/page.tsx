'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import AuthShell from '@/components/auth/auth-shell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const d = await res.json()
      if (d.success) setMessage(d.message || 'تم الإرسال')
      else setError(d.error || 'حدث خطأ ما')
    } catch {
      setError('حدث خطأ ما')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="نسيت كلمة المرور؟"
      subtitle="أدخل بريدك وسنرسل لك رابطًا لإعادة التعيين"
      brandTitle={<>لا تقلق، <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 via-amber-400 to-orange-400">نسترجعها معًا.</span></>}
      brandDesc="رابط آمن يصلك على بريدك خلال لحظات، وتعود إلى حسابك ومتجرك بسرعة."
      footer={<>تذكرت كلمة المرور؟{' '}<Link href="/auth/login" className="text-[var(--primary-strong)] hover:text-[var(--primary)] font-bold transition-colors">تسجيل الدخول</Link></>}
    >
      {message ? (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-start gap-2.5">
          <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          <p className="text-sm text-emerald-700 font-medium">{message}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div key={error} className="auth-shake p-3.5 rounded-2xl bg-red-50 border border-red-200/70 flex items-start gap-2.5">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}
          <Input
            label="البريد الإلكتروني"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="h-12 rounded-2xl focus:ring-[var(--a-500)] focus:border-[var(--a-500)] transition-shadow"
          />
          <Button type="submit" loading={loading} className="w-full py-3.5 rounded-2xl brand-gradient text-white font-black text-base shadow-[0_16px_32px_-12px_rgba(37,78,219,0.7)] hover:brightness-110 active:scale-[0.99] transition-all duration-300">إرسال رابط إعادة التعيين</Button>
        </form>
      )}
    </AuthShell>
  )
}
