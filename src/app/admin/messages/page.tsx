'use client'

import { useState } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export default function AdminMessagesPage() {
  const [title, setTitle] = useState('رسالة من الإدارة')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState('')

  async function send() {
    if (!message.trim()) return
    setSending(true)
    setResult('')
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, link }),
      })
      const d = await res.json()
      if (d.success) {
        setResult(`✓ ${d.message}`)
        setMessage('')
        setLink('')
      } else {
        setResult(`✗ ${d.error || 'حدث خطأ ما'}`)
      }
    } catch (e) { console.error(e); setResult('✗ خطأ في الاتصال') } finally { setSending(false) }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="رسائل جماعية" subtitle="أرسل إشعارًا لكل المستخدمين المسجلين" />

        <Card className="max-w-2xl">
          <CardContent className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">نص الرسالة (يظهر كإشعار عند الجميع)</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              placeholder="مثال: نعلن عن تخفيضات هذا الأسبوع على جميع المنتجات..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <Input label="العنوان" value={title} onChange={e => setTitle(e.target.value)} />
            <Input label="رابط (اختياري)" value={link} onChange={e => setLink(e.target.value)} placeholder="/pricing" />
            {result && <p className="text-sm text-emerald-600 font-medium">{result}</p>}
            <div className="flex justify-end">
              <Button type="button" onClick={send} loading={sending} disabled={!message.trim()}>إرسال للجميع</Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">ستصل الرسالة كإشعار بنغمة الجرس لكل المستخدمين النشطين.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}