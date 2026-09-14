'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

const num = (n: number) => new Intl.NumberFormat('ar-DZ-u-nu-latn').format(n)

function StepHead({ no, title }: { no: string; title: string }) {
  return (
    <h3 className="flex items-center gap-3 text-base font-extrabold text-[var(--ink)] mb-4">
      <span dir="ltr" className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] text-[var(--primary-strong)] text-xs font-black flex items-center justify-center border border-gray-200">
        {no}
      </span>
      {title}
    </h3>
  )
}

interface CheckoutProduct {
  id: string
  title: string
  price: number
  isFree?: boolean
  creator?: { user?: { name?: string | null } | null } | null
}

function CheckoutForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get('product')
  const [product, setProduct] = useState<CheckoutProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [coupon, setCoupon] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (productId) {
      fetch(`/api/products/${productId}`)
        .then(r => r.json())
        .then(d => { setProduct(d.data); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }, [productId])

  function applyCoupon() {
    if (!coupon.trim() || !product) return
    setCouponLoading(true)
    setCouponError('')
    fetch(`/api/coupons/validate?code=${encodeURIComponent(coupon.trim())}&productId=${product.id}`)
      .then(r => r.json())
      .then(d => {
        if (d?.success && typeof d?.data?.discount === 'number') {
          setCouponDiscount(d.data.discount)
          setCouponApplied(d.data.code || coupon.trim().toUpperCase())
        } else {
          setCouponDiscount(0)
          setCouponApplied('')
          setCouponError(d?.error || 'كود غير صالح')
        }
      })
      .catch(() => {
        setCouponDiscount(0)
        setCouponApplied('')
        setCouponError('تعذر التحقق من الكود')
      })
      .finally(() => setCouponLoading(false))
  }

  function removeCoupon() {
    setCoupon('')
    setCouponDiscount(0)
    setCouponApplied('')
    setCouponError('')
  }

  async function handleCheckout() {
    if (!product) return
    setProcessing(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, couponCode: couponApplied || coupon.trim() || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.data?.redirectUrl) {
          setRedirecting(true)
          window.location.assign(data.data.redirectUrl)
        } else {
          router.push(`/checkout/success?order=${data.data.orderNumber}`)
        }
      } else {
        setError(data.error || 'فشلت عملية الشراء')
      }
    } catch { setError('حدث خطأ ما') }
    finally { setProcessing(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]"><div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>
  if (!product) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]"><p className="text-gray-500">المنتج غير موجود</p></div>

  const finalPrice = Math.max(0, product.price - couponDiscount)

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
          <div className="relative h-9 w-9 rounded-xl brand-gradient flex items-center justify-center shadow-md shadow-[var(--a-600)]/30 group-hover:scale-105 transition-transform">
            <span className="text-white font-bold text-sm">R2</span>
          </div>
          <span className="text-xl font-bold text-[var(--ink)] tracking-tight">R2 - <span className="brand-text">PLATFORM</span></span>
        </Link>

        <div className="mb-8 border-b-2 border-gray-200 pb-6">
          <span className="overline-label text-[var(--primary-strong)] inline-flex items-center gap-2">
            <span className="w-8 h-px bg-current" />
            الدفع الآمن عبر CCP
          </span>
          <h1 className="mt-3 text-3xl font-black text-[var(--ink)] display-tight">إتمام الشراء</h1>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent>
              <StepHead no="01" title="ملخص الطلب" />
              <div className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="w-14 h-14 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--ink)]">{product.title}</p>
                  <p className="text-sm text-gray-500">{product.creator?.user?.name || 'مبدع'}</p>
                </div>
                <span className="font-bold text-[var(--primary-strong)] text-lg tabular-nums">{num(product.price)} دج</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <StepHead no="02" title="كود الخصم (اختياري)" />
              {couponApplied ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="flex-1 text-sm font-bold text-emerald-700">
                    تم تطبيق <span className="font-mono" dir="ltr">{couponApplied}</span> — وفّرت {num(couponDiscount)} دج
                  </p>
                  <button onClick={removeCoupon} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">إزالة</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input value={coupon} onChange={e => { setCoupon(e.target.value); setCouponError('') }} placeholder="أدخل كود الخصم" />
                    <Button variant="outline" onClick={applyCoupon} loading={couponLoading}>تطبيق</Button>
                  </div>
                  {couponError && <p className="mt-2 text-sm text-red-600 font-medium">{couponError}</p>}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-[var(--a-200)]">
            <CardContent>
              <StepHead no="03" title="المبلغ الإجمالي" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">المجموع الفرعي</span><span className="text-[var(--ink)] font-medium">{num(product.price)} دج</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-emerald-600 font-medium"><span>الخصم</span><span>-{num(couponDiscount)} دج</span></div>}
                <div className="border-t border-gray-200 pt-4 mt-2 flex items-end justify-between">
                  <span className="text-lg font-bold">الإجمالي</span>
                  <span className="text-3xl font-black text-[var(--primary-strong)] tabular-nums">{num(finalPrice)} <span className="text-base font-bold">دج</span></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200"><p className="text-sm text-red-600">{error}</p></div>}

          {redirecting ? (
            <div className="p-3.5 rounded-lg bg-[var(--primary-soft)] border border-gray-200">
              <p className="text-sm text-[var(--primary-strong)] flex items-center gap-2 font-medium">
                <span className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                جارٍ تحويلك إلى بوابة الدفع الآمنة (بريدي موب / بطاقة CIB)…
              </p>
            </div>
          ) : (
            <Button onClick={handleCheckout} loading={processing} className="w-full h-12 text-base">
              {product.isFree ? 'تحميل مجاني' : 'تأكيد الطلب والدفع'}
            </Button>
          )}

          <p className="text-center text-xs text-gray-500">
            بالضغط على &quot;تأكيد الطلب&quot; أنت توافق على{' '}
            <Link href="/legal/terms" className="text-[var(--primary-strong)] font-semibold hover:underline">الشروط والأحكام</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--bg)]"><div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>}>
      <CheckoutForm />
    </Suspense>
  )
}
