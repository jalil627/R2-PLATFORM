'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import Select from '@/components/ui/select'
import SessionHeader from '@/components/layout/session-header'
import Footer from '@/components/layout/footer'
import { COMPLAINT_TYPES, complaintStatusLabel, complaintStatusBadge } from '@/lib/complaints'

export default function ComplaintsPage() {
  const [submitted, setSubmitted] = useState<{ ref: string; id: string } | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [trackMode, setTrackMode] = useState(false)
  const [trackRef, setTrackRef] = useState('')
  const [trackEmail, setTrackEmail] = useState('')
  interface TrackResult {
    ref: string
    status: string
    subject?: string | null
    createdAt: string
    adminNote?: string | null
  }
  const [trackResult, setTrackResult] = useState<TrackResult | null>(null)
  const [trackError, setTrackError] = useState('')
  const [tracking, setTracking] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const formData = new FormData(e.currentTarget)
      const body = {
        name: formData.get('name'),
        email: formData.get('email'),
        type: formData.get('type'),
        subject: formData.get('subject'),
        message: formData.get('message'),
      }
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setSubmitted(data.data)
      } else {
        setError(data.error || 'حدث خطأ ما، حاول مرة أخرى')
      }
    } catch (err) {
      console.error(err)
      setError('خطأ في الاتصال، حاول مرة أخرى')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTrack(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTrackError('')
    setTrackResult(null)
    setTracking(true)
    try {
      const params = new URLSearchParams({ ref: trackRef, email: trackEmail })
      const res = await fetch(`/api/complaints/track?${params}`)
      const data = await res.json()
      if (data.success) {
        setTrackResult(data.data)
      } else {
        setTrackError(data.error || 'لم نتمكن من تتبع الشكوى')
      }
    } catch (err) {
      console.error(err)
      setTrackError('خطأ في الاتصال، حاول مرة أخرى')
    } finally {
      setTracking(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <SessionHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="text-center mb-10">
          <span className="ghost-ink text-6xl sm:text-7xl font-extrabold leading-none tracking-tighter select-none block mb-4">04</span>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl brand-gradient text-white mb-4 shadow-[0_10px_24px_-10px_rgba(37,78,219,0.7)]">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h1 className="display-tight text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-2">خانة الشكاوى</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            لنا حرص على دعمكم الكامل؛ شاركنا مشكلتك أو شكواك وسيقوم فريقنا بمراجعتها ومعالجتها في أقرب وقت.
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          <Button variant={trackMode ? 'outline' : 'primary'} size="sm" onClick={() => setTrackMode(false)}>تقديم شكوى</Button>
          <Button variant={trackMode ? 'primary' : 'outline'} size="sm" onClick={() => setTrackMode(true)}>تتبع الشكاوى</Button>
        </div>

        {trackMode ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-[var(--shadow-sm)] p-6">
            <h2 className="text-lg font-bold text-[var(--ink)] mb-1">تتبع حالة الشكوى</h2>
            <p className="text-sm text-gray-500 mb-6">أدخل رقم الشكوى والبريد الإلكتروني المستخدم في التقديم.</p>
            <form onSubmit={handleTrack} className="space-y-4">
              <Input label="رقم الشكوى" placeholder="مثال: 8N4K2X9Q" value={trackRef} onChange={e => setTrackRef(e.target.value)} required />
              <Input label="البريد الإلكتروني" type="email" placeholder="you@example.com" value={trackEmail} onChange={e => setTrackEmail(e.target.value)} required />
              {trackError && <p className="text-sm text-red-500">{trackError}</p>}
              <Button type="submit" className="w-full" loading={tracking}>تتبع</Button>
            </form>

            {trackResult && (
              <div className="mt-6 space-y-3 border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">الرقم</span>
                  <span className="text-sm font-mono font-bold text-[var(--ink)]">{trackResult.ref}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">الموضوع</span>
                  <span className="text-sm font-medium text-[var(--ink)]">{trackResult.subject}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">تاريخ التقديم</span>
                  <span className="text-sm text-[var(--ink)]">{new Date(trackResult.createdAt).toLocaleString('ar-DZ-u-nu-latn')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">الحالة</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${complaintStatusBadge(trackResult.status)}`}>
                    {complaintStatusLabel(trackResult.status)}
                  </span>
                </div>
                {trackResult.adminNote && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    <strong>رد الفريق:</strong> {trackResult.adminNote}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : submitted ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-[var(--shadow-sm)]">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--ink)] mb-2">تم استلام شكواك!</h2>
            <p className="text-gray-500 mb-4">رقم شكوتك:</p>
            <p className="inline-flex items-center px-4 py-2 rounded-xl bg-[var(--primary-soft)] text-lg font-mono font-bold text-[var(--primary-strong)] border border-[var(--a-500)]/30">
              {submitted.ref}
            </p>
            <p className="text-gray-500 mt-4">احتفظ بهذا الرقم لتتبع حالة الشكوى، وسيتواصل معك فريقنا قريبًا.</p>
            <Button variant="outline" className="mt-6" onClick={() => { setSubmitted(null); setTrackMode(true) }}>تتبع الحالة الآن</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-[var(--shadow-sm)] p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="الاسم الكامل" name="name" placeholder="اسمك" required minLength={2} />
              <Input label="البريد الإلكتروني" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <Select label="نوع الشكوى" name="type" defaultValue="general" options={[...COMPLAINT_TYPES]} />
            <Input label="الموضوع" name="subject" placeholder="اختصار الشكوى" required minLength={3} />
            <Textarea label="تفاصيل الشكوى" name="message" rows={6} placeholder="اشرح المشكلة بالتفصيل، مع أي معلومات تساعدنا على المعالجة..." required minLength={10} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" loading={submitting}>إرسال الشكوى</Button>
            <p className="text-xs text-gray-400 text-center">
              سيصل تنبيه لفريق الإدارة فور الإرسال، وتُعالج الشكاوى خلال 48 ساعة.
            </p>
          </form>
        )}

        <div className="text-center mt-10">
          <Link href="/help" className="text-sm text-[var(--primary-strong)] hover:underline">مشكلة تقنية أو استفسار؟ زر مركز المساعدة</Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}