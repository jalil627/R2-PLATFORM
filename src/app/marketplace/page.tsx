import Link from 'next/link'
import { auth } from '@/lib/auth/config'
import HomeHeader from '@/components/layout/home-header'
import SheetCard from '@/components/design/sheet-card'
import { listProducts, listCategories } from '@/lib/catalog'

interface MarketplaceSessionUser {
  role?: string | null
}

interface MarketplaceCategory {
  id: string
  slug: string
  name: string
  nameAr?: string | null
  _count?: { products?: number | null } | null
}

interface MarketplaceProduct {
  id: string
  slug: string
  title: string
  type: string
  price: number
  thumbnail?: string | null
  images?: { url: string }[] | null
  isFree?: boolean
  downloadCount?: number | null
  creator?: { user?: { name?: string | null; username?: string | null } | null } | null
}

const num = (n: number) => new Intl.NumberFormat('ar-DZ-u-nu-latn').format(n)

async function getProducts(searchParams: Record<string, string>) {
  try {
    const { products, total, page, pageSize, totalPages } = await listProducts(searchParams)
    return { success: true, data: products as MarketplaceProduct[], total, page, pageSize, totalPages }
  } catch { return { success: false, data: [] as MarketplaceProduct[], total: 0, page: 1, pageSize: 12, totalPages: 1 } }
}

async function getCategories() {
  try {
    const categories = await listCategories()
    return { success: true, data: categories }
  } catch { return { data: [] } }
}

const sortOptions = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'best-selling', label: 'الأكثر مبيعًا' },
  { value: 'trending', label: 'الرائج' },
  { value: 'price-low', label: 'السعر: من الأقل للأعلى' },
  { value: 'price-high', label: 'السعر: من الأعلى للأقل' },
  { value: 'rating', label: 'الأعلى تقييمًا' },
]

const typeFilters = [
  { value: '', label: 'الكل' },
  { value: 'EBOOK', label: 'كتب إلكترونية' },
  { value: 'TEMPLATE', label: 'قوالب' },
  { value: 'COURSE', label: 'دورات' },
  { value: 'SOFTWARE', label: 'برمجيات' },
  { value: 'VIDEO', label: 'فيديوهات' },
  { value: 'AUDIO', label: 'صوتيات' },
]

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams
  const [productsRes, categoriesRes] = await Promise.all([getProducts(sp), getCategories()])
  const products = productsRes.data || []
  const total = productsRes.total || 0
  const categories = categoriesRes.data || []
  const session = await auth()
  const user = session?.user || null
  const role = (user as MarketplaceSessionUser | null | undefined)?.role || ''
  const dashHref = user ? (role === 'CREATOR' || role === 'SUPER_ADMIN' ? '/creator/dashboard' : role === 'ADMIN' ? '/admin' : '/dashboard') : '/auth/register'

  const hasFilters = Boolean(sp.q || sp.category || sp.type || sp.sort && sp.sort !== 'newest')
  const activeCategory = categories.find((c: MarketplaceCategory) => c.slug === sp.category)

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <HomeHeader user={user} dashHref={dashHref} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Editorial header */}
        <div className="mb-10 border-b-2 border-gray-200 pb-8">
          <div className="flex items-end justify-between gap-6">
            <div className="flex items-center gap-5">
              <span className="ghost-ink text-6xl sm:text-7xl font-black tabular-nums select-none leading-none" dir="ltr">MK</span>
              <div>
                <span className="overline-label text-[var(--primary-strong)] inline-flex items-center gap-2">
                  <span className="w-8 h-px bg-current" />
                  المتجر
                </span>
                <h1 className="mt-2 text-3xl sm:text-5xl font-black text-[var(--ink)] display-tight">السوق</h1>
                <p className="mt-2 text-gray-500">اكتشف منتجات رقمية مميزة من مبدعين جزائريين</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-bold text-[var(--ink-soft)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
              {num(total)} {total === 1 ? 'منتج' : 'منتجًا'}
            </span>
          </div>
        </div>

        {/* Catalog + filter rail */}
        <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-8 items-start">
          {/* Filter rail */}
          <aside className="rounded-3xl border border-gray-200/80 bg-white p-6 lg:sticky lg:top-24 space-y-7 shadow-[var(--shadow-sm)]">
            <form action="/marketplace" className="space-y-5">
              <div className="relative">
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  name="q"
                  defaultValue={sp.q || ''}
                  placeholder="ابحث عن منتجات..."
                  className="w-full h-11 pr-10 pl-4 rounded-xl border border-gray-300 bg-[var(--bg)] text-[var(--ink)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <p className="overline-label text-[11px] text-gray-400 mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-current" />
                  الترتيب
                </p>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((o) => (
                    <button
                      key={o.value}
                      type="submit"
                      name="sort"
                      value={o.value}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${(sp.sort || 'newest') === o.value
                        ? 'brand-gradient text-white border-transparent shadow-[0_8px_16px_-8px_rgba(37,78,219,0.7)]'
                        : 'border-gray-200 text-gray-600 hover:border-[var(--a-400)] hover:text-[var(--primary-strong)]'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="overline-label text-[11px] text-gray-400 mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-current" />
                  النوع
                </p>
                <div className="space-y-1.5">
                  {typeFilters.map((t) => (
                    <button
                      key={t.value}
                      type="submit"
                      name="type"
                      value={t.value}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-right border transition-colors cursor-pointer ${(sp.type || '') === t.value
                        ? 'bg-[var(--primary-soft)] text-[var(--primary-strong)] border-[var(--a-200)]'
                        : 'border-transparent text-gray-600 hover:bg-black/[0.03]'
                      }`}
                    >
                      <span>{t.label}</span>
                      {t.value && (
                        <svg className={`w-3.5 h-3.5 rtl:rotate-180 ${(sp.type || '') === t.value ? 'text-[var(--primary)]' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="pt-5 border-t border-gray-200">
              <p className="overline-label text-[11px] text-gray-400 mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-current" />
                الفئات
              </p>
              <div className="space-y-1.5">
                <Link
                  href="/marketplace"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${!sp.category
                    ? 'brand-gradient text-white border-transparent shadow-[0_8px_16px_-8px_rgba(37,78,219,0.6)]'
                    : 'border-transparent text-gray-600 hover:bg-black/[0.03]'
                  }`}
                >
                  <span>كل الفئات</span>
                  <span className="text-xs tabular-nums opacity-70">{num(categories.reduce((acc: number, c: MarketplaceCategory) => acc + (c._count?.products || 0), 0))}</span>
                </Link>
                {categories.map((cat: MarketplaceCategory) => (
                  <Link
                    key={cat.id}
                    href={`/marketplace?category=${cat.slug}`}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${sp.category === cat.slug
                      ? 'bg-[var(--primary-soft)] text-[var(--primary-strong)] border-[var(--a-200)]'
                      : 'border-transparent text-gray-600 hover:bg-black/[0.03]'
                    }`}
                  >
                    <span>{cat.nameAr || cat.name}</span>
                    <span className="text-xs tabular-nums opacity-70">{num(cat._count?.products || 0)}</span>
                  </Link>
                ))}
              </div>
            </div>

            {hasFilters && (
              <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--primary-strong)] hover:text-[var(--primary)] transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                مسح الفلاتر
              </Link>
            )}
          </aside>

          {/* Results */}
          <div className="min-w-0">
            {products.length > 0 && (
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500">
                  عرض {num(products.length)} من {num(total)}
                </p>
                {activeCategory ? (
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary-strong)] border border-gray-200">
                    {activeCategory.nameAr || activeCategory.name}
                  </span>
                ) : null}
              </div>
            )}

            {products.length === 0 ? (
              total === 0 ? (
                <div className="relative overflow-hidden rounded-3xl border border-dashed border-gray-300 bg-white">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-soft)]/60 via-transparent to-[var(--primary-soft)]/60" />
                  <div className="absolute -top-20 -left-20 w-72 h-72 bg-[var(--a-200)]/40 rounded-full blur-3xl" />
                  <div className="absolute -bottom-24 -right-16 w-80 h-80 bg-[var(--a-200)]/40 rounded-full blur-3xl" />
                  <div className="relative px-8 py-20 sm:px-16 lg:px-24 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary-soft)] border border-gray-200 text-[var(--primary-strong)] text-sm font-medium mb-8">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
                      </span>
                      نستقبل حاليًا المبدعين الأوائل
                    </div>

                    <svg className="w-16 h-16 text-[var(--primary)] mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>

                    <h2 className="text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-3 tracking-tight">السوق في انتظار أول المبدعين</h2>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                      عندما يرفع أي مبدع أول منتج ويتم اعتماده، سيظهر هنا مباشرة. أعط منتجك الرقمي متجرًا احترافيًا وابدأ البيع في دقائق.
                    </p>

                    <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
                      {[
                        { n: '1', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', title: 'أنشئ حساب مبدع', desc: 'سجّل كمبدع أو افتح متجرك من حسابك الحالي' },
                        { n: '2', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', title: 'ارفع منتجك الرقمي', desc: 'كتب، قوالب، دورات، برمجيات — أي ملف غير محدود' },
                        { n: '3', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'ابدأ البيع وفُضّ أرباحك', desc: 'أرباحك تجمع لك ويمكنك سحبها متى شئت' },
                      ].map(s => (
                        <div key={s.n} className="bg-white border border-gray-200 rounded-2xl p-5 text-center hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-300">
                          <div className="w-11 h-11 mx-auto mb-3 rounded-xl brand-gradient flex items-center justify-center shadow-[0_12px_24px_-10px_rgba(37,78,219,0.6)]">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={s.icon} />
                            </svg>
                          </div>
                          <p className="font-semibold text-[var(--ink)] mb-1">{s.title}</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Link href="/auth/become-creator" className="inline-flex px-8 py-3.5 rounded-full brand-gradient text-white font-bold shadow-[0_18px_36px_-14px_rgba(37,78,219,0.7)] hover:shadow-xl hover:brightness-110 hover:-translate-y-0.5 transition-all">
                        افتح متجرك الآن
                      </Link>
                      <Link href="/features" className="inline-flex items-center px-8 py-3.5 rounded-full border border-gray-300 text-gray-700 font-bold hover:bg-white transition-colors">
                        اكتشف مميزات المنصة
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-[var(--ink)] mb-1">لم يتم العثور على منتجات</h3>
                  <p className="text-gray-500">جرّب تغيير الفلاتر أو البحث بكلمات مختلفة</p>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((product: MarketplaceProduct, i: number) => (
                  <SheetCard key={product.id} product={product} index={i} format={num} />
                ))}
              </div>
            )}

            {productsRes.totalPages > 1 && (
              <div className="flex justify-center mt-10 gap-2">
                {Array.from({ length: productsRes.totalPages }, (_, i) => i + 1).map(p => (
                  <Link
                    key={p}
                    href={`/marketplace?${new URLSearchParams({ ...sp, page: String(p) }).toString()}`}
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all ${p === Number(sp.page || 1) ? 'brand-gradient text-white shadow-[0_8px_18px_-8px_rgba(37,78,219,0.6)]' : 'bg-white text-gray-600 border border-gray-200 hover:border-[var(--a-400)]'}`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}