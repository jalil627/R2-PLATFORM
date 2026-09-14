'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Overline } from '@/components/design/page-head'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import Select from '@/components/ui/select'
import SessionHeader from '@/components/layout/session-header'

export default function HelpPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState('technical')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => {
        if (d?.data) {
          setLoggedIn(true)
          setName(d.data.name || '')
          setEmail(d.data.email || '')
        }
      })
      .catch(() => {})
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          type,
          subject: subject.trim(),
          message: message.trim(),
        }),
      })
      const d = await res.json()
      if (d.success) setSent(true)
      else setError(d.error || 'حدث خطأ ما')
    } catch {
      setError('حدث خطأ ما')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <SessionHeader />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <span className="ghost-ink text-6xl sm:text-7xl font-extrabold leading-none tracking-tighter select-none block mb-4">01</span>
        <Overline>R2 · HELP DESK</Overline>
        <h1 className="display-tight text-3xl sm:text-4xl font-bold text-[var(--ink)] mt-3 mb-2">مركز المساعدة</h1>
        <p className="text-gray-500 mb-6">كيف يمكننا مساعدتك؟</p>

        <div className="mb-8 flex flex-wrap gap-3">
          <Link href="/complaints" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold brand-gradient text-white shadow-[0_8px_18px_-8px_rgba(37,78,219,0.55)] hover:brightness-110 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            تقديم شكوى
          </Link>
        </div>

        {sent ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-[var(--shadow-sm)]">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--ink)] mb-2">تم إرسال طلبك!</h2>
            <p className="text-gray-500">سيرد فريق الدعم خلال 48 ساعة.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-[var(--shadow-sm)] p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <Select label="نوع الطلب" value={type} onChange={e => setType(e.target.value)} options={[
              { value: 'technical', label: 'مشكلة تقنية' },
              { value: 'billing', label: 'الفواتير والمدفوعات' },
              { value: 'account', label: 'مشكلة في الحساب' },
              { value: 'product', label: 'استفسار عن منتج' },
              { value: 'other', label: 'أخرى' },
            ]} />
            {!loggedIn && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="الاسم" placeholder="اسمك" required minLength={2} value={name} onChange={e => setName(e.target.value)} />
                <Input label="البريد الإلكتروني" type="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            )}
            <Input label="الموضوع" placeholder="اختصار الطلب" required minLength={3} value={subject} onChange={e => setSubject(e.target.value)} />
            <Textarea label="الوصف" rows={5} placeholder="اشرح مشكلتك بالتفصيل..." required minLength={10} value={message} onChange={e => setMessage(e.target.value)} />
            <Button type="submit" loading={loading} className="w-full">إرسال الطلب</Button>
          </form>
        )}
      </main>
    </div>
  )
}
