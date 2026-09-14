import Link from 'next/link'
import { auth } from '@/lib/auth/config'
import HomeHeader from '@/components/layout/home-header'
import SmartImage from '@/components/ui/smart-image'
import StoreShareButton from './store-share'
import { safeExternalUrl } from '@/lib/utils'
import { getStoreWithProducts } from '@/lib/catalog'

const num = (n: number) => new Intl.NumberFormat('ar-DZ-u-nu-latn').format(n)

const typeCover: Record<string, { bg: string; label: string; icon: string }> = {
  EBOOK: { bg: 'linear-gradient(135deg,#f97316,#b45309)', label: 'كتاب إلكتروني', icon: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0-10v4m0-8v1' },
  PDF: { bg: 'linear-gradient(135deg,#ef4444,#991b1b)', label: 'PDF', icon: 'M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zm7 0v5h5' },
  ZIP: { bg: 'linear-gradient(135deg,#8b5cf6,#5b21b6)', label: 'ملف مضغوط', icon: 'M3 7l9-4 9 4v10l-9 4-9-4V7zm9-4v10m-9-6l9 4 9-4' },
  TEMPLATE: { bg: 'linear-gradient(135deg,#06b6d4,#0e7490)', label: 'قالب', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm4 9l2-2 2 2 3-3' },
  COURSE: { bg: 'linear-gradient(135deg,#10b981,#065f46)', label: 'دورة', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0v6m-9-1a9 9 0 0118 0' },
  VIDEO: { bg: 'linear-gradient(135deg,#f43f5e,#be123c)', label: 'فيديو', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zm-9 6a2 2 0 01-2-2V10a2 2 0 012-2h6a2 2 0 012 2v4a2 2 0 01-2 2H6z' },
  AUDIO: { bg: 'linear-gradient(135deg,#6366f1,#4338ca)', label: 'صوتي', icon: 'M9 19V6l12-3v13m-12 3a3 3 0 11-6 0 3 3 0 016 0zm12-3a3 3 0 11-6 0 3 3 0 016 0z' },
  SOFTWARE: { bg: 'linear-gradient(135deg,#22c55e,#15803d)', label: 'برنامج', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  RESOURCE: { bg: 'linear-gradient(135deg,#14b8a6,#0f766e)', label: 'مورد', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  BUNDLE: { bg: 'linear-gradient(135deg,#eab308,#a16207)', label: 'حزمة', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  FREE: { bg: 'linear-gradient(135deg,#0ea5e9,#0369a1)', label: 'مجاني', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.982 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
}

interface StoreSessionUser {
  role?: string | null
}

interface StoreListProduct {
  id: string
  slug: string
  title: string
  type: string
  price: number
  thumbnail?: string | null
  isFree?: boolean
  rating?: number | null
}

function ProductCard({ product }: { product: StoreListProduct }) {
  const t = typeCover[product.type] || typeCover.RESOURCE
  return (
    <Link href={`/product/${product.slug}`} className="group bg-white rounded-2xl border border-gray-200/70 overflow-hidden hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-all">
      <div className="aspect-[4/3] relative overflow-hidden">
        {product.thumbnail ? (
          <SmartImage src={product.thumbnail} alt={product.title} className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full" style={{ background: t.bg }}>
            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
              <svg className="w-10 h-10 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} /></svg>
              <span className="text-[10px] font-bold text-white/90 bg-black/20 px-2 py-0.5 rounded-full">{t.label}</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-[var(--ink)] mb-1 line-clamp-1 group-hover:text-[var(--primary-strong)] transition-colors">{product.title}</h3>
        <div className="flex items-center justify-between">
          <span className="font-bold text-[var(--ink)]">{product.isFree ? 'مجاني' : `${num(product.price)} دج`}</span>
          <span className="text-sm text-amber-500">★ {product.rating?.toFixed(1) || '0.0'}</span>
        </div>
      </div>
    </Link>
  )
}

async function getStore(slug: string) {
  try {
    const result = await getStoreWithProducts(slug)
    if (!result) return { success: false }
    return { success: true, data: result }
  } catch { return { success: false } }
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [res, session] = await Promise.all([getStore(slug), auth()])
  const user = session?.user || null
  const role = (user as StoreSessionUser | null | undefined)?.role || ''
  const dashHref = user ? (role === 'CREATOR' || role === 'SUPER_ADMIN' ? '/creator/dashboard' : role === 'ADMIN' ? '/admin' : '/dashboard') : '/auth/register'

  if (!res.success || !res.data) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
        <HomeHeader user={user} dashHref={dashHref} />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center">
            <span className="ghost-ink text-6xl font-extrabold leading-none tracking-tighter select-none block mb-3">STORE</span>
            <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">المتجر غير موجود</h1>
            <Link href="/marketplace" className="text-[var(--primary-strong)] hover:underline">العودة للسوق</Link>
          </div>
        </div>
      </div>
    )
  }

  const { store, products } = res.data
  // Sanitize at render too: rows stored before link validation may hold `javascript:` URIs.
  const rawLinks: Record<string, unknown> = (store.links as Record<string, unknown>) || {}
  const storeLinks: Record<string, string> = Object.fromEntries(
    Object.entries(rawLinks)
      .map(([key, value]) => [key, safeExternalUrl(value)])
      .filter((entry): entry is [string, string] => entry[1] !== null)
  )

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <HomeHeader user={user} dashHref={dashHref} />

      <div className="relative overflow-hidden bg-gradient-to-b from-[var(--section-tint)] to-[var(--bg)] border-b border-gray-200/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(60rem 30rem at 90% -10%, rgba(59,109,246,0.12) 0%, transparent 55%), radial-gradient(45rem 25rem at 0% 110%, rgba(37,78,219,0.10) 0%, transparent 55%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-6">
          <div className="flex items-end justify-between gap-4 mb-2">
            <div className="flex items-end gap-4 flex-wrap">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white shadow-[var(--shadow-md)] overflow-hidden flex items-center justify-center border-4 border-white flex-shrink-0 ring-1 ring-gray-200">
                {store.logo || store.user?.avatar ? (
                  <SmartImage src={store.logo || store.user?.avatar || ''} alt={store.name} className="object-cover" sizes="128px" />
                ) : (
                  <span className="text-5xl font-bold brand-text">{store.name?.[0] || 'م'}</span>
                )}
              </div>
              <div className="pb-1">
                <p className="overline-label text-[10px] font-semibold tracking-widest text-[var(--primary-strong)] mb-1.5">R2 · STORE</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink)]">{store.name}</h1>
                  {store.isVerified && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1 border border-emerald-200">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l3 3 3.5-.5.5 3.5 3 1.5-1 3 1.5 3-3 1.5L21 22l-3.5-1L15 21l-3-3-3 3-2.5-1L3 20l1-3.5L1 15.5l2-3L1 9l3-1.5 1-3.5L8.5 5 12 1z" /></svg>
                      موثق
                    </span>
                  )}
                </div>
                {store.bio && <p className="text-sm text-gray-500 mt-1 max-w-xl">{store.bio}</p>}
                {storeLinks.website && (
                  <a href={storeLinks.website} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm text-[var(--primary-strong)] hover:underline">
                    <svg className="w-4 h-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {storeLinks.website}
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="h-0.5 w-full bg-gradient-to-l from-transparent via-[var(--a-500)] to-transparent opacity-50 mt-5" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 pb-16">
        <div className="flex flex-wrap gap-2 mb-8 items-center">
          <span className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 font-medium">{products.length} منتج</span>
          {storeLinks.twitter && <a href={storeLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">تويتر / X</a>}
          {storeLinks.instagram && <a href={storeLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">انستغرام</a>}
          <StoreShareButton slug={store.slug} name={store.name} />
        </div>

        <div className="flex items-center gap-3 mb-5">
          <span aria-hidden="true" className="ghost-ink text-4xl sm:text-5xl font-extrabold leading-none tracking-tighter select-none">01</span>
          <div>
            <p className="overline-label text-[10px] font-semibold text-[var(--primary-strong)]">R2 · CATALOG</p>
            <h2 className="text-lg font-bold text-[var(--ink)]">منتجات المتجر</h2>
          </div>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500">لا توجد منتجات منشورة بعد — تابع صاحب المتجر ليصلك كل جديد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: StoreListProduct) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}