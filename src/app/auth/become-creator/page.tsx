'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'

const benefits = [
  { title: 'متجرك الخاص', desc: 'صفحة متجر احترافية بهويتك' },
  { title: 'بيع غير محدود', desc: 'ارفع أي عدد من المنتجات' },
  { title: 'إحصائيات متقدمة', desc: 'تتبع مبيعاتك وعملاءك' },
  { title: 'سحب سريع', desc: 'اسحب أرباحك متى شئت' },
]

export default function BecomeCreatorPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/creator/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: formData.get('storeName'),
          storeSlug: formData.get('storeSlug'),
        }),
      })
      const data = await res.json()
      if (data.success) {
        await signOut({ redirect: false })
        router.push('/auth/login?onboarded=true')
      } else {
        setError(data.error || 'حدث خطأ ما')
      }
    } catch { setError('حدث خطأ ما') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--ink)] px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
            <div className="relative h-11 w-11 rounded-xl brand-gradient flex items-center justify-center shadow-lg shadow-[var(--a-600)]/30 transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-base tracking-tight">R2</span>
              <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-[var(--gold)] border-2 border-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">R2 - <span className="brand-text">PLATFORM</span></span>
          </Link>
          <p className="overline-label inline-flex items-center gap-2 mx-auto mb-3 text-[11px] font-semibold text-[var(--primary-strong)]">
            <span className="h-px w-6 bg-[var(--a-500)]" />
            R2 · CREATOR
            <span className="h-px w-6 bg-[var(--a-500)]" />
          </p>
          <h1 className="display-tight text-2xl font-bold text-[var(--ink)]">افتح متجرك</h1>
          <p className="text-sm text-gray-500 mt-2">انضم إلى مبدعي R2 - PLATFORM</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {benefits.map((b) => (
            <div key={b.title} className="p-3.5 rounded-xl border border-gray-200 bg-white/60">
              <p className="text-sm font-medium text-[var(--ink)] mb-1">{b.title}</p>
              <p className="text-xs text-gray-500">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-[var(--shadow-sm)] border border-gray-200 p-6">
          {error && <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200"><p className="text-sm text-blue-600">{error}</p></div>}
          <form onSubmit={onSubmit} className="space-y-4">
            <Input name="storeName" label="اسم المتجر" placeholder="مثال: ستوديو التصميم" required />
            <Input name="storeSlug" label="رابط المتجر" placeholder="my-store" hint="souqraqmi.com/store/my-store" />
            <Button type="submit" loading={loading} className="w-full h-12 rounded-xl brand-gradient text-white font-bold shadow-[0_10px_24px_-10px_rgba(37,78,219,0.7)]">فتح المتجر</Button>
          </form>
        </div>
      </div>
    </div>
  )
}