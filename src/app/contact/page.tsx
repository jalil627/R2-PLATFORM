'use client'

import { useState } from 'react'
import { Overline } from '@/components/design/page-head'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import Select from '@/components/ui/select'
import SessionHeader from '@/components/layout/session-header'

const TOPIC_TO_TYPE: Record<string, string> = {
  general: 'general',
  support: 'technical',
  billing: 'billing',
  partnership: 'other',
  other: 'other',
}

const TOPIC_LABELS: Record<string, string> = {
  general: 'استفسار عام',
  support: 'دعم فني',
  billing: 'الفواتير والمدفوعات',
  partnership: 'شراكة',
  other: 'أخرى',
}

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('general')
  const [message, setMessage] = useState('')

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
          type: TOPIC_TO_TYPE[topic] || 'general',
          subject: `[تواصل] ${TOPIC_LABELS[topic] || 'استفسار عام'}`,
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
      <div className="mx-auto max-w-2xl px-4 py-16">
        <span className="ghost-ink text-6xl sm:text-7xl font-extrabold leading-none tracking-tighter select-none block mb-4">03</span>
        <Overline>R2 · CONTACT</Overline>
        <h1 className="display-tight text-3xl sm:text-4xl font-bold text-[var(--ink)] mt-3 mb-2">تواصل معنا</h1>
        <p className="text-gray-500 mb-8">يسعدنا تواصلك معنا. سنرد خلال 48 ساعة.</p>

        {sent ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-[var(--shadow-sm)]">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--ink)] mb-2">تم إرسال رسالتك!</h2>
            <p className="text-gray-500">سنتواصل معك قريبًا.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-[var(--shadow-sm)] p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="الاسم" placeholder="اسمك" required minLength={2} value={name} onChange={e => setName(e.target.value)} />
              <Input type="email" label="البريد الإلكتروني" placeholder="email@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <Select label="الموضوع" value={topic} onChange={e => setTopic(e.target.value)} options={[
              { value: 'general', label: 'استفسار عام' },
              { value: 'support', label: 'دعم فني' },
              { value: 'billing', label: 'الفواتير والمدفوعات' },
              { value: 'partnership', label: 'شراكة' },
              { value: 'other', label: 'أخرى' },
            ]} />
            <Textarea label="الرسالة" placeholder="اكتب رسالتك هنا..." rows={5} required minLength={10} value={message} onChange={e => setMessage(e.target.value)} />
            <Button type="submit" loading={loading} className="w-full">إرسال الرسالة</Button>
          </form>
        )}
      </div>
    </div>
  )
}
