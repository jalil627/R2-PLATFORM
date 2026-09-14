'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import AuthShell from '@/components/auth/auth-shell'

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const onboarded = searchParams.get('onboarded') === 'true'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      await signIn('credentials', {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        redirectTo: callbackUrl,
      })
    } catch {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="مرحبًا بعودتك"
      subtitle="سجل الدخول لمتابعة رحلتك في السوق"
      brandTitle={<>بِع إبداعك،<br /><span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 via-amber-400 to-orange-400">واكسب منه.</span></>}
      brandDesc="سوق المنتجات الرقمية الجزائري — انشر منتجاتك، استقبل المدفوعات، واسحب أرباحك إلى حسابك البنكي."
      footer={<>ليس لديك حساب؟{' '}<Link href="/auth/register" className="text-[var(--primary-strong)] hover:text-[var(--primary)] font-bold transition-colors">إنشاء حساب جديد</Link></>}
    >
      <button
        type="button"
        onClick={() => signIn('google', { redirectTo: callbackUrl })}
        className="group w-full flex items-center justify-center gap-3 h-12 px-4 rounded-2xl border border-gray-200 bg-white text-gray-700 font-bold hover:border-gray-300 hover:shadow-[0_12px_28px_-12px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 mb-5"
      >
        <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        المتابعة بحساب جوجل
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
        <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-400 font-medium">أو بالبريد الإلكتروني</span></div>
      </div>

      {onboarded && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-start gap-2.5">
          <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-sm text-emerald-700 font-medium">تم فتح متجرك بنجاح. سجل الدخول مرة أخرى للوصول إلى لوحة المبدع.</p>
        </div>
      )}

      {error && (
        <div key={error} className="auth-shake mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200/70 flex items-start gap-2.5">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          name="email"
          type="email"
          label="البريد الإلكتروني"
          placeholder="name@example.com"
          required
          className="h-12 rounded-2xl focus:ring-[var(--a-500)] focus:border-[var(--a-500)] transition-shadow"
        />
        <div>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="كلمة المرور"
              placeholder="••••••••"
              required
              className="h-12 rounded-2xl pl-12 focus:ring-[var(--a-500)] focus:border-[var(--a-500)] transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              className="absolute left-3 bottom-0 h-12 flex items-center text-gray-400 hover:text-[var(--primary-strong)] transition-colors"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-[var(--a-600)]" />
            تذكرني
          </label>
          <Link href="/auth/forgot-password" className="text-sm text-[var(--primary-strong)] hover:text-[var(--primary)] font-bold transition-colors">نسيت كلمة المرور؟</Link>
        </div>
        <Button type="submit" loading={loading} className="w-full py-3.5 rounded-2xl brand-gradient text-white font-black text-base shadow-[0_16px_32px_-12px_rgba(37,78,219,0.7)] hover:shadow-[0_20px_40px_-12px_rgba(37,78,219,0.8)] hover:brightness-110 active:scale-[0.99] transition-all duration-300">تسجيل الدخول</Button>
      </form>
    </AuthShell>
  )
}

export default function LoginFormWrapper() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
