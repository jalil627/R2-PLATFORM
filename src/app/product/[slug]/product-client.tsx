'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { formatRelativeTime, formatDate } from '@/lib/utils'
import { TypeFallbackIcon } from '@/components/product/cover'
import SmartImage from '@/components/ui/smart-image'

const LS = {
  recents: 'sr:recents',
  wishes: 'sr:wishes',
  draft: (id: string) => `sr:draft:${id}`,
  rated: (id: string) => `sr:rated:${id}`,
  copied: (slug: string) => `sr:copied:${slug}`,
}

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const v = window.localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

function writeLS(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

const typeLabels: Record<string, string> = {
  EBOOK: 'كتاب إلكتروني',
  PDF: 'ملف PDF',
  ZIP: 'ملف مضغوط',
  TEMPLATE: 'قالب',
  COURSE: 'دورة',
  VIDEO: 'فيديو',
  AUDIO: 'صوتي',
  SOFTWARE: 'برمجية',
  RESOURCE: 'مورد رقمي',
  BUNDLE: 'حزمة منتجات',
  FREE: 'مجاني',
  PAY_WHAT_YOU_WANT: 'ادفع ما تشاء',
}

const num = (n: number) => new Intl.NumberFormat('ar-DZ-u-nu-latn').format(n)

interface ClientReviewUser {
  name?: string | null
  avatar?: string | null
}

interface ClientReview {
  id: string
  rating: number
  title?: string | null
  text?: string | null
  createdAt: string
  isVerifiedPurchase?: boolean
  creatorResponse?: string | null
  user?: ClientReviewUser | null
}

interface ProductState {
  owned: boolean
  isOwner: boolean
  productOwnerId: string
  creatorProfileId: string
  myReview: ClientReview | null
  inWishlist: boolean
  following: boolean
}

interface ProductStatePayload {
  state: ProductState | null
  authed: boolean
}

async function fetchProductState(slug: string): Promise<ProductStatePayload> {
  try {
    const res = await fetch(`/api/products/${slug}/state`, { cache: 'no-store' })
    if (res.status === 401) {
      return { state: null, authed: false }
    }
    const j = (await res.json()) as { data?: ProductState | null }
    return { state: j.data || null, authed: true }
  } catch {
    return { state: null, authed: false }
  }
}

function useProductState(slug: string) {
  const [state, setState] = useState<ProductState | null>(null)
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchProductState(slug)
      .then(({ state: next, authed: nextAuthed }) => {
        if (!cancelled) {
          setState(next)
          setAuthed(nextAuthed)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState(null)
          setAuthed(false)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  async function reload() {
    try {
      const { state: next, authed: nextAuthed } = await fetchProductState(slug)
      setState(next)
      setAuthed(nextAuthed)
    } catch {
      setState(null)
      setAuthed(false)
    } finally {
      setReady(true)
    }
  }

  return { state, ready, authed, setState, reload }
}

// ─────────────────────────────────────────────────────────────────────────────
// واجهة دور التقييم الزمنية (السنة بالثواني)
// ─────────────────────────────────────────────────────────────────────────────

function RatingPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">
        تقييمك ({value > 0 ? `${value} من 10` : 'من 1 إلى 10'})
      </p>
      <div className="flex flex-wrap gap-1.5" dir="ltr">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
              value === n
                ? 'bg-amber-400 text-white shadow-md shadow-amber-400/30 scale-105'
                : value > n
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-600'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function ReviewItem({
  review,
  isMine,
  onEdit,
  onDelete,
}: {
  review: ClientReview
  isMine?: boolean
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <div className={`p-4 rounded-xl border ${isMine ? 'border-amber-200 bg-amber-50/60' : 'border-gray-100 bg-gray-50/60'}`}>
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <Avatar name={review.user?.name || 'مستخدم'} src={review.user?.avatar} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{review.user?.name || 'مستخدم'}</p>
          <p className="text-xs text-gray-400">{formatRelativeTime(review.createdAt)}</p>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
          {review.rating}/10
        </span>
        {review.isVerifiedPurchase && (
          <Badge variant="success">
            <svg className="w-3 h-3 me-1 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4 2.5 4.5 4.5 0 00-4.5.5 4.5 4.5 0 00-2.5 4 4.5 4.5 0 000 6.5A4.5 4.5 0 001 16.5a4.5 4.5 0 004 .5 4.5 4.5 0 005 2 4.5 4.5 0 005-2.5 4.5 4.5 0 004-.5 4.5 4.5 0 000-6.5 4.5 4.5 0 00.5-4 4.5 4.5 0 00-4-.5 4.5 4.5 0 00-4-2.5zm3.7 7.7a.75.75 0 10-1.4-.5l-1.9 5.6-2.3-2.3a.75.75 0 00-1 1l3 3a.75.75 0 001.2-.4l2.4-7.4z" clipRule="evenodd" /></svg>
            شراء موثق
          </Badge>
        )}
      </div>
      {review.title && <p className="font-medium text-sm text-gray-900 mb-1">{review.title}</p>}
      {review.text && <p className="text-sm text-gray-600 whitespace-pre-wrap">{review.text}</p>}
      {review.creatorResponse && (
        <div className="mt-3 p-3 rounded-lg bg-[var(--primary-soft)] border border-gray-200">
          <p className="text-xs font-semibold text-[var(--primary-strong)] mb-1">رد المبدع</p>
          <p className="text-sm text-gray-600">{review.creatorResponse}</p>
        </div>
      )}
      {isMine && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>تعديل</Button>
          <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50" onClick={onDelete}>حذف</Button>
        </div>
      )}
    </div>
  )
}

interface ReviewSectionProduct {
  id: string
  slug: string
  isFree?: boolean
  rating?: number
  reviewCount?: number
  ratingBreakdown?: { rating: number; count: number }[]
  reviews?: ClientReview[]
}

export function ReviewSection({ product }: { product: ReviewSectionProduct }) {
  const { state, ready, authed } = useProductState(product.slug)
  const [list, setList] = useState<ClientReview[]>(product.reviews || [])
  const [myReview, setMyReview] = useState<ClientReview | null>(null)
  const [form, setForm] = useState({ rating: 0, title: '', text: '' })
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.resolve(state?.myReview || null)
      .then((next) => {
        if (!cancelled && ready && state) {
          setMyReview(next)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [ready, state])

  const allReviews = list
  const totalCount = Math.max(allReviews.length, product.reviewCount || 0)
  const avg = allReviews.length
    ? allReviews.reduce((a, r) => a + r.rating, 0) / allReviews.length
    : product.rating || 0
  const breakdown = Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => ({
    rating: n,
    count: allReviews.length ? allReviews.filter((r) => r.rating === n).length : (product.ratingBreakdown || []).find((b: { rating: number; count: number }) => b.rating === n)?.count || 0,
  }))
  const maxCount = Math.max(...breakdown.map((b) => b.count), 1)

  // استعادة المسودة
  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled && ready && authed && state?.owned && !state.myReview) {
        const d = readLS<{ rating: number; title: string; text: string } | null>(LS.draft(product.id), null)
        if (d) setForm((f) => ({ ...f, ...d }))
      }
    }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [ready, authed, state, product.id])

  // حفظ المسودة
  useEffect(() => {
    if (ready && authed && state?.owned && !state.myReview && (form.rating > 0 || form.title || form.text)) {
      writeLS(LS.draft(product.id), form)
    }
  }, [form, ready, authed, state, product.id])

  const canReview = authed && state?.owned && !state?.isOwner
  const ratedBefore = typeof window !== 'undefined' && localStorage.getItem(LS.rated(product.id)) !== null && !authed

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setErr('')
    if (form.rating < 1) {
      setErr('اختر تقييمًا من 1 إلى 10')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: myReview ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          rating: form.rating,
          title: form.title.trim() || undefined,
          text: form.text.trim() || undefined,
        }),
      })
      const j = await res.json()
      if (!res.ok) {
        setErr(j.error || 'فشل حفظ التقييم')
        setSubmitting(false)
        return
      }
      setMyReview(j.data)
      setMsg(myReview ? 'تم تحديث تقييمك' : 'تم نشر تقييمك بنجاح')
      if (!myReview) {
        writeLS(LS.rated(product.id), '1')
        try { window.localStorage.removeItem(LS.draft(product.id)) } catch {}
      }
      const all = await fetch(`/api/reviews?productId=${product.id}`, { cache: 'no-store' }).then((r) => r.json())
      if (all.success) setList(all.data)
      setEditing(false)
    } catch {
      setErr('حدث خطأ ما')
    } finally {
      setSubmitting(false)
    }
  }

  async function remove() {
    setMsg('')
    setErr('')
    const res = await fetch(`/api/reviews?productId=${product.id}`, { method: 'DELETE' })
    if (res.ok) {
      setMyReview(null)
      setForm({ rating: 0, title: '', text: '' })
      setEditing(false)
      try { window.localStorage.removeItem(LS.draft(product.id)) } catch {}
      const all = await fetch(`/api/reviews?productId=${product.id}`, { cache: 'no-store' }).then((r) => r.json())
      if (all.success) setList(all.data)
      setMsg('تم حذف تقييمك')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[var(--shadow-sm)] p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-gray-900">التقييمات والتعليقات</h2>
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-900">{avg.toFixed(1)}</span>
            <span className="text-sm text-gray-500">من 10 — {totalCount} {totalCount === 1 ? 'تقييم' : 'تقييمًا'}</span>
          </div>
        )}
      </div>

      {/* توزيع التقييمات */}
      {totalCount > 0 && (
        <div className="mb-6 space-y-1.5">
          {breakdown.map((b) => (
            <div key={b.rating} className="flex items-center gap-3">
              <span className="w-8 text-sm font-medium text-gray-500 shrink-0 text-left">{b.rating}</span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-amber-400 to-amber-500"
                  style={{ width: `${(b.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-10 text-sm text-gray-400 shrink-0 text-left">{b.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* نموذج التقييم */}
      {!ready ? null : (
        canReview ? (
          myReview && !editing ? null : (
            <form onSubmit={submit} className="mb-6 p-4 rounded-xl border border-dashed border-gray-300 bg-[var(--primary-soft)] border border-gray-200">
              <p className="font-medium text-gray-900 mb-4">
                {myReview ? 'عدّل تقييمك' : 'شارك رأيك — تقييمك يساعد المبدع والمشترين'}
              </p>
              <div className="space-y-4">
                <RatingPicker
                  value={form.rating}
                  onChange={(n) => setForm((f) => ({ ...f, rating: n }))}
                />
                <Input
                  label="عنوان التقييم (اختياري)"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="مثال: ممتاز، يستحق الشراء"
                  maxLength={120}
                />
                <Textarea
                  label="تعليقك"
                  value={form.text}
                  onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                  placeholder="اكتب تجربتك مع هذا المنتج..."
                  maxLength={2000}
                  required
                />
                {err && <p className="text-sm text-blue-500">{err}</p>}
                <div className="flex gap-2">
                  <Button type="submit" loading={submitting}>{myReview ? 'حفظ التعديلات' : 'نشر التقييم'}</Button>
                  {myReview && (
                    <Button type="button" variant="ghost" onClick={() => { setEditing(false) }}>إلغاء</Button>
                  )}
                </div>
                <p className="text-xs text-gray-400">مسودتك تُحفظ تلقائيًا في متصفحك حتى لا تفقدها إذا أغلقت الصفحة.</p>
              </div>
            </form>
          )
        ) : authed && state?.isOwner ? (
          <div className="mb-6 p-4 rounded-xl bg-[var(--primary-soft)] border border-gray-200 text-sm text-gray-500">
            لا يمكنك تقييم منتجك الخاص، لكن يمكنك الرد على تعليقات المشترين.
          </div>
        ) : authed && !state?.owned ? (
          <div className="mb-6 p-4 rounded-xl bg-[var(--primary-soft)] border border-gray-200 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-[var(--primary-strong)]">اشترِ هذا المنتج لتتمكن من تقييمه وكتابة تعليق.</p>
            <Link
              href={`/checkout?product=${product.id}`}
              className="inline-flex items-center h-9 px-4 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              {product.isFree ? 'تحميل مجاني ثم قيّم' : 'اشترِ الآن ثم قيّم'}
            </Link>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-xl bg-[var(--primary-soft)] border border-gray-200 border border-gray-200 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-gray-600">
              {ratedBefore ? 'لقد قيّمت هذا المنتج سابقًا من هذا المتصفح.' : 'سجّل الدخول لشراء المنتج والقيام بتقييم.'}
            </p>
            <Link
              href={`/auth/login?callbackUrl=/product/${product.slug}`}
              className="inline-flex items-center h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              دخول
            </Link>
          </div>
        )
      )}

      {msg && <p className="mb-4 text-sm text-emerald-600">{msg}</p>}

      {/* قائمة التقييمات */}
      {allReviews.length === 0 ? (
        <div className="text-center py-10">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-gray-500">لا توجد تقييمات بعد — كن أول من يقيّم هذا المنتج!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myReview && editing && (
            <p className="text-sm text-amber-600">جارٍ تحرير تقييمك الحالي بالأسفل.</p>
          )}
          {allReviews.map((r) => (
            <ReviewItem
              key={r.id}
              review={r}
              isMine={myReview?.id === r.id}
              onEdit={() => {
                setEditing(true)
                setForm({ rating: r.rating, title: r.title || '', text: r.text || '' })
                setMsg('')
              }}
              onDelete={remove}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// لوحة الشراء (العمود الجانبي)
// ─────────────────────────────────────────────────────────────────────────────

interface BuyPanelProduct {
  id: string
  slug: string
  title: string
  type: string
  price: number
  compareAtPrice?: number | null
  isFree?: boolean
  rating?: number | null
  reviewCount?: number | null
  downloadCount?: number | null
  viewCount?: number | null
  saleCount?: number | null
  license?: string | null
  creatorId?: string | null
  updatedAt?: string | null
  createdAt?: string | null
  creator?: { user?: { name?: string | null; avatar?: string | null } | null; isVerified?: boolean } | null
  store?: { slug?: string | null; name?: string | null } | null
  categories?: { category?: { slug?: string | null; name?: string | null; nameAr?: string | null } | null }[] | null
}

export function BuyPanel({ product }: { product: BuyPanelProduct }) {
  const router = useRouter()
  const { state, ready, authed, setState } = useProductState(product.slug)
  const [wishGhost, setWishGhost] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [dlErr, setDlErr] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.resolve()
      .then(() => readLS<string[]>(LS.wishes, []))
      .then((wishIds) => {
        if (!cancelled && !authed) {
          setWishGhost(wishIds.includes(product.id))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [authed, product.id])

  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0
  const loginHref = `/auth/login?callbackUrl=/product/${product.slug}`
  const checkoutHref = `/checkout?product=${product.id}`

  async function toggleWish() {
    if (!authed) {
      router.push(loginHref)
      return
    }
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id }),
    })
    if (res.status === 401) {
      router.push(loginHref)
      return
    }
    const j = await res.json()
    if (j.success) {
      const added = j.data?.action === 'added'
      setState((s) => (s ? { ...s, inWishlist: added } : s))
      const wishIds = readLS<string[]>(LS.wishes, [])
      const next = added ? [...new Set([...wishIds, product.id])] : wishIds.filter((id) => id !== product.id)
      writeLS(LS.wishes, next)
      setWishGhost(added)
    }
  }

  async function toggleFollow() {
    if (!authed) {
      router.push(loginHref)
      return
    }
    const res = await fetch('/api/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorId: product.creatorId }),
    })
    if (res.status === 401) {
      router.push(loginHref)
      return
    }
    const j = await res.json()
    if (j.success) {
      const followed = j.data?.action === 'followed'
      setState((s) => (s ? { ...s, following: followed } : s))
    }
  }

  async function share() {
    const url = `${window.location.origin}/product/${product.slug}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    writeLS(LS.copied(product.slug), Date.now())
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  async function download() {
    setDownloading(true)
    setDlErr('')
    try {
      const res = await fetch(`/api/downloads/${product.id}`)
      const j = await res.json()
      if (res.ok && j.success) {
        window.open(j.data.url, '_blank')
      } else {
        setDlErr(j.error || 'تعذر التنزيل')
      }
    } catch {
      setDlErr('تعذر التنزيل')
    } finally {
      setDownloading(false)
    }
  }

  const inWish = state?.inWishlist ?? wishGhost

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[var(--shadow-sm)] p-6">
      {/* السعر */}
      <div className="mb-5">
        {product.isFree ? (
          <span className="text-3xl font-bold text-emerald-600">مجاني</span>
        ) : (
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-bold text-gray-900">{num(product.price)} دج</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">{num(product.compareAtPrice || 0)} دج</span>
                <Badge variant="danger">-{discount}%</Badge>
              </>
            )}
          </div>
        )}
      </div>

      {/* شارة التقييم */}
      {(product.reviewCount || 0) > 0 && (
        <div className="flex items-center gap-2 mb-5 pb-5 border-b border-gray-100">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold text-sm">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            {Number(product.rating || 0).toFixed(1)}/10
          </span>
          <span className="text-sm text-gray-500">الرابط والتحميلات موثوقة من {product.reviewCount} تقييم</span>
        </div>
      )}

      {/* زر الشراء */}
      {!ready ? (
        <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
      ) : state?.owned ? (
        <div className="mb-5">
          <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
            أنت تملك هذا المنتج
          </div>
          <Button onClick={download} loading={downloading} className="w-full h-12 text-base" variant="success">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
            تنزيل الملف
          </Button>
          {dlErr && <p className="mt-2 text-sm text-blue-500">{dlErr}</p>}
        </div>
      ) : state?.isOwner ? (
        <div className="mb-5 p-3 rounded-lg bg-[var(--primary-soft)] border border-gray-200">
          <p className="text-sm text-[var(--primary-strong)] font-medium mb-2">هذا منتجك</p>
          <Link href="/creator/products" className="inline-flex items-center h-10 px-4 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors">
            إدارة منتجاتي
          </Link>
        </div>
      ) : (
        <Button
          className="w-full h-12 text-base"
          onClick={() => {
            router.push(checkoutHref)
          }}
        >
          {!authed
            ? 'سجّل الدخول للشراء'
            : product.isFree
              ? 'تحميل مجاني'
              : 'اشترِ الآن'}
        </Button>
      )}

      {/* المفضلة والمشاركة */}
      {!state?.isOwner && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="outline" onClick={toggleWish} className={inWish ? 'bg-rose-50 text-rose-600 border-rose-200' : ''}>
            <svg className={`w-4 h-4 ${inWish ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {inWish ? 'في المفضلة' : 'أضف للمفضلة'}
          </Button>
          <Button variant="outline" onClick={share}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {copied ? 'تم النسخ ✓' : 'مشاركة'}
          </Button>
        </div>
      )}

      {/* المبدع + متابعة */}
      <div className="mt-5 pt-5 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <Avatar name={product.creator?.user?.name || 'مبدع'} src={product.creator?.user?.avatar} size="md" />
          <div className="flex-1 min-w-0">
            <Link href={`/store/${product.store?.slug || ''}`} className="block text-sm font-medium text-gray-900 hover:text-[var(--primary-strong)] truncate">
              {product.creator?.user?.name || 'مبدع'}
              {product.creator?.isVerified && (
                <svg className="inline-block w-3.5 h-3.5 text-blue-600 fill-current ms-1" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4 2.5 4.5 4.5 0 00-4.5.5 4.5 4.5 0 00-2.5 4 4.5 4.5 0 000 6.5A4.5 4.5 0 001 16.5a4.5 4.5 0 004 .5 4.5 4.5 0 005 2 4.5 4.5 0 005-2.5 4.5 4.5 0 004-.5 4.5 4.5 0 000-6.5 4.5 4.5 0 00.5-4 4.5 4.5 0 00-4-.5 4.5 4.5 0 00-4-2.5zm3.7 7.7a.75.75 0 10-1.4-.5l-1.9 5.6-2.3-2.3a.75.75 0 00-1 1l3 3a.75.75 0 001.2-.4l2.4-7.4z" clipRule="evenodd" /></svg>
              )}
            </Link>
            <p className="text-xs text-gray-400">{product.store?.name || 'متجر المبدع'}</p>
          </div>
          {!authed ? (
            <Link href={loginHref} className="inline-flex items-center h-8 px-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
              متابعة
            </Link>
          ) : !state?.isOwner ? (
            <Button size="sm" variant={state?.following ? 'outline' : 'primary'} onClick={toggleFollow}>
              {state?.following ? 'متابَع ✓' : 'متابعة'}
            </Button>
          ) : null}
        </div>
      </div>

      {/* معلومات منظمة */}
      <div className="mt-5 pt-4 border-t border-gray-100 space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">النوع</span>
          <span className="font-medium text-gray-900">{typeLabels[product.type] || product.type}</span>
        </div>
        {product.categories?.[0] && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">التصنيف</span>
            <Link href={`/marketplace?category=${product.categories[0].category?.slug || ''}`} className="font-medium text-gray-900 hover:text-[var(--primary-strong)]">
              {product.categories[0].category?.nameAr || product.categories[0].category?.name}
            </Link>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">المبيعات</span>
          <span className="font-medium text-gray-900">{num(product.saleCount || 0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">التحميلات</span>
          <span className="font-medium text-gray-900">{num(product.downloadCount || 0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">المشاهدات</span>
          <span className="font-medium text-gray-900">{num(product.viewCount || 0)}</span>
        </div>
        {product.license && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">الترخيص</span>
            <span className="font-medium text-gray-900">{product.license}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">آخر تحديث</span>
          <span className="font-medium text-gray-900">{formatDate(product.updatedAt || product.createdAt || '')}</span>
        </div>
      </div>

      {/* الدفع الآمن */}
      {!product.isFree && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            دفع آمن ومشفّر
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">بريدي موب</Badge>
            <Badge variant="outline">eDahabia</Badge>
            <Badge variant="outline">بطاقة CIB</Badge>
          </div>
          <Link href="/legal/refund" className="block mt-3 text-xs text-[var(--primary-strong)] hover:underline">سياسة الاسترداد</Link>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// منتجات تصفحتها مؤخرًا (localStorage)
// ─────────────────────────────────────────────────────────────────────────────

interface RecentProduct {
  slug: string
  title: string
  thumbnail?: string | null
  price: number
  isFree?: boolean
  type: string
}

interface RecentItem {
  slug: string
  title: string
  thumbnail: string
  price: number
  isFree?: boolean
  type: string
}

function buildRecents(product: RecentProduct): RecentItem[] {
  const cur = readLS<RecentItem[]>('sr:recents', [])
  const next = [
    { slug: product.slug, title: product.title, thumbnail: product.thumbnail || '', price: product.price, isFree: product.isFree, type: product.type },
    ...cur.filter((r) => r.slug !== product.slug),
  ].slice(0, 8)
  return next
}

export function RecentlyViewed({ product }: { product: RecentProduct }) {
  const [items, setItems] = useState<RecentItem[]>([])
  const [mounted, setMounted] = useState(false)
  const { slug, title, thumbnail, price, isFree, type } = product

  useEffect(() => {
    let cancelled = false
    Promise.resolve()
      .then(() => buildRecents({ slug, title, thumbnail, price, isFree, type }))
      .then((next) => {
        try {
          window.localStorage.setItem('sr:recents', JSON.stringify(next))
        } catch {
          /* ignore */
        }
        if (!cancelled) {
          setItems(next.slice(0, 6))
          setMounted(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMounted(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [slug, title, thumbnail, price, isFree, type])

  if (!mounted || items.length < 2) return null

  return (
    <section className="bg-white rounded-2xl border border-gray-200/80 shadow-[var(--shadow-sm)] p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        تصفحت مؤخرًا
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((r) => (
          <Link
            key={r.slug}
            href={`/product/${r.slug}`}
            className="group rounded-xl border border-gray-100 hover:border-blue-300 overflow-hidden transition-colors"
          >
            <div className="relative aspect-video flex items-center justify-center overflow-hidden">
              {r.thumbnail ? (
                <SmartImage src={r.thumbnail} alt={r.title} className="object-cover" />
              ) : (
                <div className="w-full h-full"><TypeFallbackIcon type={r.type} iconSize={28} /></div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-[var(--primary-strong)] transition-colors">{r.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{r.isFree ? 'مجاني' : `${num(r.price)} دج`}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function SharePanel({ productId, slug, title, userId }: { productId: string; slug: string; title: string; userId?: string }) {
  const [origin] = useState(() => (typeof window !== 'undefined' ? window.location.origin : ''))
  const [copied, setCopied] = useState(false)
  const [refCode, setRefCode] = useState('')
  const [refCopied, setRefCopied] = useState(false)
  const [loadingRef, setLoadingRef] = useState(false)
  const [refError, setRefError] = useState('')

  const shareUrl = origin ? `${origin}/product/${slug}` : ''

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  async function createRef() {
    if (!userId || refCode) return
    setLoadingRef(true)
    setRefError('')
    try {
      const res = await fetch('/api/creator/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      const d = await res.json()
      if (d.success && d.data?.code) {
        setRefCode(d.data.code)
      } else {
        setRefError(d.error || 'لا يمكنك إنشاء رابط دعوة')
      }
    } catch { setRefError('خطأ في الاتصال') } finally { setLoadingRef(false) }
  }

  async function copyRef() {
    const url = `${shareUrl}?ref=${refCode}`
    try {
      await navigator.clipboard.writeText(url)
      setRefCopied(true)
      setTimeout(() => setRefCopied(false), 2000)
    } catch {}
  }

  const whatsAppText = encodeURIComponent(`شوف هاد المنتج الرهيب "${title}" — ${shareUrl}`)

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[var(--shadow-sm)] p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        شارك المنتج
      </h3>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button onClick={copyLink} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-[var(--primary-soft)] transition-colors text-xs font-medium text-gray-700">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          {copied ? 'تم النسخ ✓' : 'نسخ الرابط'}
        </button>
        <a href={`https://api.whatsapp.com/send?text=${whatsAppText}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors text-xs font-medium text-gray-700">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
          واتساب
        </a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-[var(--primary-soft)] transition-colors text-xs font-medium text-gray-700">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
          فيسبوك
        </a>
      </div>

      {userId && (
        <div className="border-t border-gray-100 pt-4">
          <button onClick={createRef} disabled={loadingRef} className="w-full text-left p-3 rounded-xl bg-[var(--primary-soft)] hover:bg-[var(--a-100)] transition-colors">
            <p className="text-sm font-semibold text-[var(--primary-strong)]">{loadingRef ? 'جاري الإنشاء...' : 'إنشاء رابط دعوة خاص بك'}</p>
            <p className="text-xs text-blue-600 mt-1">شاركه خارج المنصة لجذب زوار ومشترين وتحقيق عمولة.</p>
          </button>
          {refError && <p className="mt-2 text-xs text-red-600">{refError}</p>}
          {refCode && (
            <div className="mt-3 bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">رابط الدعوة الخاص بك:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-gray-700 bg-white px-2 py-1 rounded truncate">{shareUrl}?ref={refCode}</code>
                <button onClick={copyRef} className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">{refCopied ? 'تم ✓' : 'نسخ'}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}