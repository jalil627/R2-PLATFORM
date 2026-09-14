'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Select from '@/components/ui/select'
import Link from 'next/link'
import { ProLocked, useProGate } from '@/components/creator/pro-lock'

const creatorLinks = [
  { label: 'نظرة عامة', href: '/creator/dashboard', icon: 'dashboard' },
  { label: 'المنتجات', href: '/creator/products', icon: 'products' },
  { label: 'الطلبات', href: '/creator/orders', icon: 'orders' },
  { label: 'العملاء', href: '/creator/customers', icon: 'customers' },
  { label: 'الإحصائيات', href: '/creator/analytics', icon: 'analytics' },
  { label: 'الأرباح', href: '/creator/earnings', icon: 'earnings' },
  { label: 'الكوبونات', href: '/creator/coupons', icon: 'coupons' },
  { label: 'التسويق بالعمولة', href: '/creator/affiliates', icon: 'affiliate' },
  { label: 'الخطة والاشتراك', href: '/creator/plans', icon: 'subscriptions' },
  { label: 'المدفوعات', href: '/creator/payouts', icon: 'payouts' },
  { label: 'إعدادات المتجر', href: '/creator/settings', icon: 'settings' },
]

interface AffiliateProduct {
  id: string
  title: string
  slug?: string | null
}

interface AffiliateLinkItem {
  id: string
  code: string
  clickCount: number
  commissionRate: number
  conversions: number
  product?: { title?: string | null; slug?: string | null } | null
}

export default function AffiliatesPage() {
  const [links, setLinks] = useState<AffiliateLinkItem[]>([])
  const [products, setProducts] = useState<AffiliateProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')
  const [copiedId, setCopiedId] = useState('')

  function load() {
    return Promise.all([
      fetch('/api/creator/affiliates').then(r => r.json()),
      fetch('/api/creator/products').then(r => r.json()),
    ]).then(([a, p]) => {
      setLinks(a.data || [])
      setProducts(p.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const gate = useProGate()
  const locked = !gate.loading && !gate.isPro

  async function create() {
    if (!selectedProduct) return
    setCreating(true)
    setMessage('')
    try {
      const res = await fetch('/api/creator/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProduct }),
      })
      const d = await res.json()
      if (d.success) {
        setMessage('تم إنشاء رابط الدعوة بنجاح')
        setSelectedProduct('')
        load()
      } else {
        setMessage(d.error || 'حدث خطأ ما')
      }
    } catch { setMessage('خطأ في الاتصال') } finally { setCreating(false) }
  }

  async function copyLink(code: string, linkId: string) {
    const url = `${typeof window !== 'undefined' ? window.origin : ''}/product/${links.find(l => l.id === linkId)?.product?.slug}?ref=${code}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(linkId)
      setTimeout(() => setCopiedId(''), 2000)
    } catch {}
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={creatorLinks} title="لوحة التحكم" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="التسويق بالعمولة" subtitle="روابط دعوة لكل منتج ومراقبة الزيارات" />

        <ProLocked locked={locked}>
        <Card className="mb-6">
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-3">إنشاء رابط دعوة لمنتج</h3>
            <p className="text-sm text-gray-500 mb-4">شارك الرابط خارج المنصة (فيسبوك، واتساب، تيك توك...)، وسيُحتسب كل زائر يدخل من خلاله.</p>
            {products.length === 0 ? (
              <p className="text-sm text-gray-400">أنشئ منتجًا أولاً لإنشاء رابط دعوة له.</p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                  placeholder="اختر المنتج"
                  options={products.map(p => ({ value: p.id, label: p.title }))}
                  className="flex-1"
                />
                <Button type="button" onClick={create} loading={creating} disabled={!selectedProduct}>إنشاء الرابط</Button>
              </div>
            )}
            {message && <p className={`mt-3 text-sm font-medium ${message.includes('خطأ') || message.includes('متاحة') ? 'text-amber-600' : 'text-emerald-600'}`}>{message}</p>}
            {message.includes('برو') && (
              <Link href="/creator/plans" className="inline-block mt-2 text-sm text-blue-700 hover:underline">الانتقال لصفحة الخطة للترقية →</Link>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        ) : links.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد روابط دعوة بعد</h3>
              <p className="text-gray-500 max-w-md mx-auto">أنشئ رابطك الأول في الأعلى وابدأ جذب الزوار إلى منتجاتك وكسب عمولة من كل عملية شراء.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {links.map(l => (
              <Card key={l.id}>
                <CardContent>
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{l.product?.title}</p>
                        <p className="text-xs text-gray-400 font-mono" dir="ltr">{l.code}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => copyLink(l.code, l.id)}>{copiedId === l.id ? 'تم ✓' : 'نسخ الرابط'}</Button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <span>{l.clickCount} زيارة</span>
                    <span>عمولة {l.commissionRate}%</span>
                    <span>{l.conversions} تحويل</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </ProLocked>
      </main>
    </div>
  )
}