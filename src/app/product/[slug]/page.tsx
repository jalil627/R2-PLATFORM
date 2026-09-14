import type { Metadata } from 'next'
import Link from 'next/link'
import { cache } from 'react'
import type { ReactNode } from 'react'
import { auth } from '@/lib/auth/config'
import HomeHeader from '@/components/layout/home-header'
import SheetCard from '@/components/design/sheet-card'
import { bytes } from '@/lib/product-format'
import { BuyPanel, ReviewSection, RecentlyViewed, SharePanel } from './product-client'
import { TypeFallbackIcon } from '@/components/product/cover'
import SmartImage from '@/components/ui/smart-image'

interface ProductPageUser {
  role?: string | null
  id?: string | null
}

interface ProductPageImage {
  url: string
}

interface ProductPageFile {
  id: string
  name: string
  size?: number | null
  mimeType?: string | null
}

interface ProductPageVersion {
  id: string
  version: string
  description?: string | null
}

interface RelatedProduct {
  id: string
  slug: string
  title: string
  type: string
  price: number
  thumbnail?: string | null
  images?: ProductPageImage[] | null
  isFree?: boolean
  downloadCount?: number | null
  creator?: { user?: { name?: string | null; username?: string | null } | null } | null
}

const num = (n: number) => new Intl.NumberFormat('ar-DZ-u-nu-latn').format(n)

function ProdSectionHead({ no, title, hint }: { no: string; title: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-5">
      <h2 className="flex items-center gap-3 text-lg font-extrabold text-[var(--ink)]">
        <span dir="ltr" className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary-strong)] text-xs font-black flex items-center justify-center border border-gray-200">
          {no}
        </span>
        {title}
      </h2>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  )
}

function ProdOver({ children }: { children: ReactNode }) {
  return (
    <span className="overline-label text-[var(--primary-strong)] inline-flex items-center gap-2">
      <span className="w-8 h-px bg-current" />
      {children}
    </span>
  )
}

function parseFaq(faq: unknown): { q?: string; a?: string; question?: string; answer?: string }[] {
  if (!faq) return []
  let value: unknown = faq
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return []
    }
  }
  return Array.isArray(value) ? (value as { q?: string; a?: string; question?: string; answer?: string }[]) : []
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

const getProduct = cache(async (slug: string) => {
  try {
    const res = await fetch(`${process.env.PLATFORM_URL || 'http://localhost:3000'}/api/products/${slug}`, { cache: 'no-store' })
    return res.json()
  } catch {
    return { success: false }
  }
})

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const res = await getProduct(slug)
  const product = res.data
  if (!res.success || !product) return { title: 'المنتج غير موجود' }

  const baseUrl = process.env.PLATFORM_URL || 'http://localhost:3000'
  const description =
    product.shortDescription ||
    (product.description ? product.description.replace(/\s+/g, ' ').trim().slice(0, 160) : product.title)

  return {
    title: product.title,
    description,
    keywords: product.seoKeywords || undefined,
    alternates: { canonical: `${baseUrl}/product/${product.slug}` },
    openGraph: {
      title: product.title,
      description,
      url: `${baseUrl}/product/${product.slug}`,
      type: 'website',
      images: product.thumbnail ? [{ url: product.thumbnail }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [res, session] = await Promise.all([getProduct(slug), auth()])
  const user = session?.user || null
  const role = (user as ProductPageUser | null | undefined)?.role || ''
  const dashHref = user ? (role === 'CREATOR' || role === 'SUPER_ADMIN' ? '/creator/dashboard' : role === 'ADMIN' ? '/admin' : '/dashboard') : '/auth/register'

  if (!res.success || !res.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg)] text-[var(--ink)]">
        <HomeHeader user={user} dashHref={dashHref} />
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">المنتج غير موجود</h1>
          <p className="text-gray-500 mb-6">قد يكون غير منشور بعد أو تمت إزالته.</p>
          <Link href="/marketplace" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg brand-gradient text-white text-sm font-semibold hover:brightness-110 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" /></svg>
            العودة للسوق
          </Link>
        </div>
      </div>
    )
  }

  const product = res.data

return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <HomeHeader user={user} dashHref={dashHref} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <Link href="/" className="hover:text-[var(--primary-strong)] transition-colors">الرئيسية</Link>
            <span className="text-gray-300">/</span>
            <Link href="/marketplace" className="hover:text-[var(--primary-strong)] transition-colors">السوق</Link>
            <span className="text-gray-300">/</span>
            <span className="text-[var(--ink)] truncate max-w-[18rem]">{product.title}</span>
          </nav>
          <span dir="ltr" className="hidden sm:block overline-label text-gray-300">R2 · PRODUCT</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* الغلاف */}
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-gray-200/80 shadow-[var(--shadow-sm)] bg-white">
              {product.thumbnail ? (
                <SmartImage src={product.thumbnail} alt={product.title} className="object-cover" eager sizes="(max-width: 1024px) 100vw, 66vw" />
              ) : product.images?.[0]?.url ? (
                <SmartImage src={product.images[0].url} alt={product.title} className="object-cover" eager sizes="(max-width: 1024px) 100vw, 66vw" />
              ) : (
                <div className="aspect-video"><TypeFallbackIcon type={product.type} iconSize={56} /></div>
              )}
              {product.status === 'APPROVED' && product.isFree && (
                <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold shadow">مجاني</span>
              )}
              {!product.isFree && product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full brand-gradient text-white text-xs font-bold shadow">
                  خصم {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                </span>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img: ProductPageImage, i: number) => (
                  <div key={i} className="relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200/80 bg-white flex-shrink-0 hover:border-[var(--a-400)] transition-colors">
                    <SmartImage src={img.url} alt={`${product.title} ${i + 1}`} className="object-cover" sizes="96px" />
                  </div>
                ))}
              </div>
            )}

            {/* العنوان والشارات */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[var(--shadow-sm)] p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <ProdOver>تفاصيل المنتج</ProdOver>
                  <h1 className="mt-3 text-2xl sm:text-4xl font-black text-[var(--ink)] display-tight leading-tight">{product.title}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
                    <svg className="w-4 h-4 text-[var(--gold)] fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    <span className="text-sm font-bold text-[var(--ink)]">{Number(product.rating || 0).toFixed(1)}/10</span>
                    <span className="text-xs text-gray-500">({num(product.reviewCount || 0)})</span>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-[var(--primary-soft)] border border-gray-200 text-sm font-medium text-[var(--primary-strong)]">
                    {typeLabels[product.type] || product.type}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-400">
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {num(product.downloadCount || 0)} تحميل
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  {num(product.viewCount || 0)} مشاهدة
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  {num(product.saleCount || 0)} عملية شراء
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  تحديث {new Date(product.updatedAt || product.createdAt).toLocaleDateString('ar-DZ')}
                </span>
              </div>

              {product.shortDescription && (
                <p className="mt-4 text-gray-500 leading-relaxed">{product.shortDescription}</p>
              )}

              {/* شارة المبدع */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                {product.creator && (
                  <Link href={`/store/${product.store?.slug || ''}`} className="flex items-center gap-3 group w-fit">
                    <div className="relative w-11 h-11 rounded-full bg-[var(--primary-soft)] overflow-hidden flex items-center justify-center text-sm font-bold text-[var(--primary-strong)] ring-2 ring-[var(--primary-soft)]">
                      {product.creator.user?.avatar ? (
                        <SmartImage src={product.creator.user.avatar} alt="" className="object-cover" sizes="48px" />
                      ) : (
                        product.creator.user?.name?.[0] || 'م'
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--primary-strong)] transition-colors flex items-center gap-1.5">
                        {product.creator.user?.name || 'مبدع'}
                        {product.creator.isVerified && (
                          <svg className="w-4 h-4 text-[var(--primary)] fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4 2.5 4.5 4.5 0 00-4.5.5 4.5 4.5 0 00-2.5 4 4.5 4.5 0 000 6.5A4.5 4.5 0 001 16.5a4.5 4.5 0 004 .5 4.5 4.5 0 005 2 4.5 4.5 0 005-2.5 4.5 4.5 0 004-.5 4.5 4.5 0 000-6.5 4.5 4.5 0 00.5-4 4.5 4.5 0 00-4-.5 4.5 4.5 0 00-4-2.5zm3.7 7.7a.75.75 0 10-1.4-.5l-1.9 5.6-2.3-2.3a.75.75 0 00-1 1l3 3a.75.75 0 001.2-.4l2.4-7.4z" clipRule="evenodd" /></svg>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{product.store?.name || 'متجر المبدع'}</p>
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {/* الوصف */}
            {product.description && (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[var(--shadow-sm)] p-6">
                <ProdSectionHead no="01" title="الوصف" />
                <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</div>
              </div>
            )}

            {/* ماذا ستحصل */}
            {(product.files?.length > 0 || product.versions?.length > 0) && (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[var(--shadow-sm)] p-6">
                <ProdSectionHead no="02" title="ماذا ستحصل؟" />
                <div className="space-y-2">
                  {product.files.map((f: ProductPageFile) => (
                    <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-10 h-10 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--ink)]">{f.name}</p>
                        <p className="text-xs text-gray-400">{bytes(f.size || 0)}</p>
                      </div>
                      {f.mimeType && <span className="text-xs text-gray-400">{f.mimeType}</span>}
                    </div>
                  ))}
                  {product.versions.map((v: ProductPageVersion) => (
                    <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-10 h-10 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">الإصدار {v.version}</p>
                        {v.description && <p className="text-xs text-gray-400">{v.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* المتطلبات */}
            {product.requirements && (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[var(--shadow-sm)] p-6">
                <ProdSectionHead no="03" title="المتطلبات" />
                <div className="text-gray-600 whitespace-pre-wrap">{product.requirements}</div>
              </div>
            )}

            {/* الأسئلة الشائعة */}
            {parseFaq(product.faq).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[var(--shadow-sm)] p-6">
                <ProdSectionHead no="04" title="الأسئلة الشائعة" />
                <div className="space-y-3">
                  {parseFaq(product.faq).map((item, i) => (
                    <details key={i} className="group rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <summary className="cursor-pointer font-semibold text-[var(--ink)] text-sm flex items-center justify-between gap-3">
                        {item.q || item.question}
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      </summary>
                      <p className="mt-3 text-sm text-gray-600 whitespace-pre-wrap">{item.a || item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* التقييمات */}
            <ReviewSection
              product={{
                id: product.id,
                slug: product.slug,
                isFree: product.isFree,
                rating: product.rating,
                reviewCount: product.reviewCount,
                ratingBreakdown: product.ratingBreakdown,
                reviews: product.reviews,
              }}
            />

            {/* تقييمات حديثة */}
            <RecentlyViewed
              product={{
                slug: product.slug,
                title: product.title,
                thumbnail: product.thumbnail,
                price: product.price,
                isFree: product.isFree,
                type: product.type,
              }}
            />

            {/* منتجات ذات صلة */}
            {product.relatedProducts?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[var(--shadow-sm)] p-6">
                <ProdSectionHead no="05" title="منتجات ذات صلة" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {product.relatedProducts.map((p: RelatedProduct, i: number) => (
                    <SheetCard key={p.id} product={p} index={i} format={num} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* العمود الجانبي */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <SharePanel
                productId={product.id}
                slug={product.slug}
                title={product.title}
                userId={(user as ProductPageUser | null | undefined)?.id || undefined}
              />
              <BuyPanel
                product={{
                  id: product.id,
                  slug: product.slug,
                  title: product.title,
                  type: product.type,
                  price: product.price,
                  compareAtPrice: product.compareAtPrice,
                  isFree: product.isFree,
                  rating: product.rating,
                  reviewCount: product.reviewCount,
                  downloadCount: product.downloadCount,
                  viewCount: product.viewCount,
                  license: product.license,
                  creatorId: product.creatorId,
                  creator: product.creator,
                  store: product.store,
                  categories: product.categories,
                  saleCount: product.saleCount,
                  updatedAt: product.updatedAt,
                  createdAt: product.createdAt,
                }}
              />
              <div className="text-xs text-gray-400 px-2 py-1">
                <p className="mb-2 font-semibold text-gray-500">هل تحتاج مساعدة؟</p>
                <div className="flex items-center gap-3">
                  <Link href="/help" className="flex items-center gap-1 hover:text-gray-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    مركز المساعدة
                  </Link>
                  <Link href="/legal/terms" className="flex items-center gap-1 hover:text-gray-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    الشروط والأحكام
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}