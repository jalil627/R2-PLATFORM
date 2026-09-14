import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'
import { auth } from '@/lib/auth/config'
import HomeHeader from '@/components/layout/home-header'
import Footer from '@/components/layout/footer'
import SheetCard from '@/components/design/sheet-card'
import SmartImage from '@/components/ui/smart-image'
import { getPlatformSettings, getPromoPlanPrices } from '@/lib/plans'
import {
  getCachedStats,
  getCachedWeekStrip,
  getCachedLatest,
  getCachedTopDownloads,
  getCachedCategories,
  getCachedTestimonials,
  getCachedFreePicks,
  getCachedTopCreators,
} from '@/lib/home-data'

const num = (n: number) => new Intl.NumberFormat('ar-DZ-u-nu-latn').format(n)

/* ─── SEO structured data ──────────────────────────────────── */

function HomeJsonLd() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const json = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'R2 - PLATFORM',
        url: site,
        description: 'منصة جزائرية لبيع وشراء المنتجات الرقمية بالدينار الجزائري.',
      },
      {
        '@type': 'WebSite',
        name: 'R2 - PLATFORM',
        url: site,
        inLanguage: 'ar',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${site}/marketplace?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
}

/* ─── Editorial primitives ─────────────────────────────────── */

function Overline({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={`overline-label text-[var(--primary-strong)] inline-flex items-center gap-2 ${className ?? ''}`}>
      <span className="w-8 h-px bg-current" />
      {children}
    </span>
  )
}

const headActionClass =
  'group hidden sm:inline-flex items-center gap-2 shrink-0 text-sm font-bold text-[var(--primary-strong)] hover:text-[var(--primary)] border-b-2 border-[var(--a-200)] pb-1 transition-colors'

function HeadAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={headActionClass}>
      {children}
      <svg className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </Link>
  )
}

function SectionHead({ no, overline, title, desc, action }: { no: string; overline: string; title: ReactNode; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-6 border-t-2 border-gray-200 pt-6 mb-10">
      <div className="flex items-center gap-5 min-w-0">
        <span className="ghost-ink text-5xl sm:text-6xl font-black tabular-nums select-none leading-none" dir="ltr" aria-hidden="true">
          {no}
        </span>
        <div className="min-w-0">
          <Overline>{overline}</Overline>
          <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-[var(--ink)] display-tight">{title}</h2>
          {desc && <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-xl leading-relaxed">{desc}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

interface PageSessionUser {
  role?: string | null
  name?: string | null
  email?: string | null
  image?: string | null
}

interface PageSessionShape {
  user?: PageSessionUser | null
}

type SessionPromise = Promise<PageSessionShape | null>

interface HeroStripImage {
  url: string
}

interface HeroStripItem {
  id: string
  slug?: string | null
  title: string
  thumbnail?: string | null
  images?: HeroStripImage[] | null
  isFree?: boolean | null
  price: number
  rating?: number | null
  downloadCount?: number | null
  creator?: { user?: { name?: string | null } | null } | null
}

interface HomeCategory {
  slug: string
  name: string
  nameAr?: string | null
  _count?: { products?: number | null } | null
}

interface HomeTestimonial {
  id: string
  text: string | null
  rating: number
  user?: { name?: string | null } | null
  product?: { slug?: string | null; title?: string | null } | null
}

interface HomeCreator {
  totalSales: number
  user: {
    name: string | null
    avatar: string | null
    store: { name: string; slug: string; logo: string | null } | null
  } | null
  _count: { products: number }
}

function dashHrefFor(user: PageSessionUser | null | undefined) {
  const role = user?.role || ''
  return user
    ? role === 'CREATOR' || role === 'SUPER_ADMIN'
      ? '/creator/dashboard'
      : role === 'ADMIN'
        ? '/admin'
        : '/dashboard'
    : '/auth/register'
}

/* ─── User-aware pieces (streamed, cheap) ──────────────────── */

async function HeaderUser({ sessionP }: { sessionP: SessionPromise }) {
  const session = await sessionP
  const user = session?.user || null
  return <HomeHeader user={user} dashHref={dashHrefFor(user)} />
}

async function HeroCta({ sessionP }: { sessionP: SessionPromise }) {
  const session = await sessionP
  const user = session?.user || null
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
      <Link
        href={dashHrefFor(user)}
        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-lg font-bold brand-gradient text-white shadow-[0_20px_44px_-16px_rgba(37,78,219,0.85)] hover:brightness-110 hover:-translate-y-0.5 transition-all"
      >
        {user ? 'لوحة التحكم' : 'ابدأ مجانًا'}
        <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
      <Link
        href="/marketplace"
        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-gray-300 text-[var(--ink)] font-bold hover:border-[var(--a-400)] hover:bg-[var(--primary-soft)]/50 transition-colors"
      >
        استكشف السوق
      </Link>
    </div>
  )
}

/* ─── Hero ──────────────────────────────────────────────────── */

function HeroShowcase({ strip }: { strip: HeroStripItem[] }) {
  const main = strip[0]
  if (!main) {
    return (
      <div className="relative rounded-[2rem] border border-dashed border-gray-300 bg-[var(--bg)] h-[400px] lg:h-[480px] flex items-center justify-center text-gray-500 text-lg font-semibold px-8 text-center">
        أولى المنتجات قادمة قريبًا — افتح متجرك الآن
      </div>
    )
  }
  const sub = strip[1]
  const mainCover = main.thumbnail || main.images?.[0]?.url
  const subCover = sub?.thumbnail || sub?.images?.[0]?.url

  return (
    <div className="relative hidden lg:block h-[520px]">
      {/* glow behind */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-70" style={{ background: 'radial-gradient(circle, rgba(59,109,246,0.22) 0%, transparent 65%)' }} aria-hidden="true" />

      {/* Main card */}
      <article className="float-slow absolute top-10 right-6 w-[400px] max-w-[86%] rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-[var(--shadow-lg)]">
        <div className="relative aspect-[16/9] overflow-hidden bg-[var(--primary-soft)]">
          {mainCover ? (
            <SmartImage src={mainCover} alt={main.title} className="object-cover" eager sizes="(max-width: 1024px) 100vw, 400px" />
          ) : (
            <div className="absolute inset-0 brand-gradient" />
          )}
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white bg-black/45 border border-white/20 backdrop-blur">
            {main.isFree ? 'مجاني' : 'متوفر الآن'}
          </span>
          <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-[var(--a-900)] bg-white/95 shadow">
            ⭐ تقييم {main.rating ?? '4.8'}
          </span>
        </div>
        <div className="p-5">
          <h4 className="text-lg font-extrabold text-[var(--ink)] line-clamp-1">{main.title}</h4>
          <p className="mt-1 text-sm text-gray-500 line-clamp-1">{main.creator?.user?.name || 'مبدع R2'}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-extrabold tabular-nums text-[var(--ink)]">
              {main.isFree ? 'مجاني' : `${num(main.price)} دج`}
            </span>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold brand-gradient text-white">
              اطلبه الآن
              <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      </article>

      {/* Overlapping product card */}
      {sub && (
        <article className="float-slower absolute -left-2 bottom-28 w-[240px] rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-[var(--shadow-lg)]">
          <div className="relative aspect-[16/10] overflow-hidden bg-[var(--primary-soft)]">
            {subCover && <SmartImage src={subCover} alt={sub.title} className="object-cover" sizes="240px" />}
          </div>
          <div className="p-3.5">
            <p className="text-sm font-bold text-[var(--ink)] line-clamp-1">{sub.title}</p>
            <p className="mt-1.5 text-sm font-extrabold tabular-nums text-[var(--primary-strong)]">
              {sub.isFree ? 'مجاني' : `${num(sub.price)} دج`}
            </p>
          </div>
        </article>
      )}

      {/* Floating toast */}
      <div className="absolute top-6 left-10 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-[var(--ink)] text-sm font-bold shadow-[var(--shadow-lg)] border border-gray-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        طلب جديد — تسليم فوري
      </div>

      {/* CCP chip */}
      <div className="absolute -bottom-2 right-16 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--gold)]/50 bg-amber-50 text-amber-700 text-xs font-bold shadow-[var(--shadow-sm)]">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h3m-5 4h12a2 2 0 002-2V8a2 2 0 00-2-2H7a2 2 0 00-2 2v9zm0 0H4a2 2 0 00-2 2v1h20v-1a2 2 0 00-2-2h-1" />
        </svg>
        الدفع عبر CCP
      </div>
    </div>
  )
}

function HeroShowcaseSkeleton() {
  return (
    <>
      <div className="hidden lg:block h-[520px] relative">
        <div className="absolute top-10 right-6 w-[400px] max-w-[86%] aspect-[16/11] rounded-3xl border border-gray-200 bg-gray-100 animate-pulse" />
        <div className="absolute -left-2 bottom-28 w-[240px] h-[200px] rounded-2xl border border-gray-200 bg-gray-100 animate-pulse" />
      </div>
      <div className="lg:hidden mt-10 flex gap-4 overflow-hidden" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="shrink-0 w-56 h-44 rounded-2xl border border-gray-200 bg-gray-100 animate-pulse" />
        ))}
      </div>
    </>
  )
}

function StatsTickerSkeleton() {
  return (
    <div className="mt-12 max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 grid grid-cols-2 md:grid-cols-4 gap-y-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="text-center">
          <div className="h-8 w-16 mx-auto rounded bg-gray-200/70 animate-pulse" />
          <div className="mt-2 h-3 w-20 mx-auto rounded bg-gray-200/60 animate-pulse" />
        </div>
      ))}
    </div>
  )
}

async function StatsTicker() {
  const stats = await getCachedStats()
  const items = [
    { value: num(stats.creators), label: 'مبدع نشط' },
    { value: num(stats.products), label: 'منتج منشور' },
    { value: num(stats.sales), label: 'عملية شراء' },
    { value: num(stats.downloads), label: 'تحميل رقمي' },
  ]
  return (
    <div className="mt-12 max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-[var(--shadow-md)] divide-x divide-gray-200 rtl:divide-x-reverse grid grid-cols-2 md:grid-cols-4">
      {items.map((s) => (
        <div key={s.label} className="px-4 py-5 text-center">
          <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[var(--ink)]">{s.value}</div>
          <div className="mt-1.5 text-sm font-medium text-gray-500">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ─── Categories marquee ────────────────────────────────────── */

async function CategoriesMarquee() {
  const categories = await getCachedCategories()
  if (categories.length === 0) return null
  const chips = categories.map((cat: HomeCategory) => ({
    slug: cat.slug,
    name: cat.nameAr || cat.name,
    count: cat._count?.products ?? 0,
  }))
  const row = (keyPrefix: string, ariaHidden: boolean) => (
    <div key={keyPrefix} className="flex items-center gap-3 px-3" aria-hidden={ariaHidden}>
      {chips.map((c) => (
        <Link
          key={`${keyPrefix}-${c.slug}`}
          href={`/marketplace?category=${c.slug}`}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full font-bold text-sm border border-gray-200 bg-[var(--bg)] text-[var(--ink-soft)] hover:border-[var(--a-400)] hover:text-[var(--primary-strong)] transition-colors whitespace-nowrap"
        >
          {c.name}
          <span className="px-2 py-0.5 rounded-full text-xs font-bold tabular-nums brand-gradient text-white">{c.count}</span>
        </Link>
      ))}
    </div>
  )
  return (
    <div className="border-y border-gray-200/70 bg-white py-6 overflow-hidden" style={{ maskImage: 'linear-gradient(to left, transparent, black 8%, black 92%, transparent)' }}>
      <div className="marquee-track">
        {row('a', false)}
        {row('b', true)}
      </div>
    </div>
  )
}

/* ─── 01 · Week rail ────────────────────────────────────────── */

function RailSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden">
          <div className="aspect-[4/3] bg-gray-200/70 animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-4/5 rounded bg-gray-200/70 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-gray-200/70 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

async function WeekRailSection() {
  const strip = await getCachedWeekStrip()
  if (strip.length === 0) return null
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          no="01"
          overline="اختيار المصممين"
          title="تشكيلة هذا الأسبوع"
          desc="منتجات مختارة رفعت حديثًا من مبدعين جزائريين."
          action={<HeadAction href="/marketplace">كل المنتجات</HeadAction>}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {strip.map((p, i) => <SheetCard key={p.id} product={p} index={i} format={num} />)}
        </div>
      </div>
    </section>
  )
}

/* ─── 02 · Latest ───────────────────────────────────────────── */

async function LatestSection() {
  const latest = await getCachedLatest()
  if (latest.length === 0) return null
  return (
    <section className="py-16 sm:py-24 bg-white border-y border-gray-200/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          no="02"
          overline="وصل حديثًا"
          title="آخر ما نشره المبدعون"
          action={<HeadAction href="/marketplace">المزيد</HeadAction>}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {latest.map((p, i) => <SheetCard key={p.id} product={p} index={i} format={num} />)}
        </div>
        <div className="mt-8 text-center lg:hidden">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--primary-strong)] border border-gray-200 rounded-full px-5 py-2.5 hover:bg-[var(--primary-soft)]">
            عرض كل المنتجات
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─── 03 · Top downloads leaderboard ────────────────────────── */

async function TopDownloadsSection() {
  const strip = await getCachedWeekStrip()
  const topDownloads = await getCachedTopDownloads(strip.map((p) => p.id))
  if (topDownloads.length === 0) return null
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          no="03"
          overline="الترتيب"
          title="الأكثر تحميلًا"
          desc="ما يواصل المشترون تنزيله هذا الشهر."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200/70 border border-gray-200/70 rounded-3xl overflow-hidden">
          {topDownloads.slice(0, 6).map((p, i) => (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              className="group flex items-center gap-5 bg-white p-5 hover:bg-[var(--primary-soft)]/50 transition-colors"
            >
              <span className="ghost-ink text-3xl font-black tabular-nums select-none" dir="ltr">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-[var(--primary-soft)]">
                {(() => {
                  const cover = p.thumbnail || p.images?.[0]?.url
                  return cover
                    ? <SmartImage src={cover} alt={p.title} className="object-cover" sizes="64px" />
                    : <div className="w-full h-full brand-gradient" />
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[var(--ink)] line-clamp-1 group-hover:text-[var(--primary-strong)] transition-colors">{p.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5 truncate">{p.creator?.user?.name || 'مبدع'}</p>
              </div>
              <div className="text-left shrink-0">
                <div className={`font-bold tabular-nums ${p.isFree ? 'text-emerald-600' : 'text-[var(--primary-strong)]'}`}>
                  {p.isFree ? 'مجاني' : `${num(p.price)} دج`}
                </div>
                <div className="inline-flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {num(p.downloadCount || 0)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── 04 · Top creators ───────────────────────────────────── */

async function CreatorsSection() {
  const creators = (await getCachedTopCreators()) as HomeCreator[]
  const withStore = creators.filter((c) => c.user?.store)
  if (withStore.length === 0) return null
  return (
    <section className="py-16 sm:py-24 bg-white border-y border-gray-200/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          no="04"
          overline="نخبة المنصة"
          title="مبدعون مميزون"
          desc="أصحاب أعلى المبيعات — تابع متاجرهم واكتشف جديد أعمالهم."
          action={<HeadAction href="/marketplace">كل المبدعين</HeadAction>}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {withStore.map((c) => {
            const store = c.user?.store
            if (!store) return null
            const logo = store.logo || c.user?.avatar
            return (
              <Link
                key={store.slug}
                href={`/store/${store.slug}`}
                className="group rounded-2xl border border-gray-200 bg-[var(--bg)] p-5 text-center hover:border-[var(--a-400)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all"
              >
                <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-white shadow-[var(--shadow-sm)] ring-1 ring-gray-200 bg-white flex items-center justify-center">
                  {logo ? (
                    <SmartImage src={logo} alt={store.name} className="object-cover" sizes="64px" />
                  ) : (
                    <span className="text-2xl font-black brand-text">{store.name?.[0] || 'م'}</span>
                  )}
                </div>
                <h3 className="mt-3 font-extrabold text-[var(--ink)] line-clamp-1 group-hover:text-[var(--primary-strong)] transition-colors">{store.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{c.user?.name || 'مبدع'}</p>
                <div className="mt-3 flex items-center justify-center gap-3 text-xs font-bold tabular-nums">
                  <span className="inline-flex items-center gap-1 text-[var(--primary-strong)]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {num(c._count.products)}
                  </span>
                  <span className="w-px h-3 bg-gray-200" aria-hidden="true" />
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {num(c.totalSales)}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── 05 · Free picks ─────────────────────────────────────── */

async function FreeSection() {
  const free = await getCachedFreePicks()
  if (free.length === 0) return null
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          no="05"
          overline="بدون مقابل"
          title="مجانيات مختارة"
          desc="منتجات مجانية عالية الجودة من مبدعي المنصة — حمّلها الآن."
          action={<HeadAction href="/marketplace">كل المجانيات</HeadAction>}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {free.map((p, i) => <SheetCard key={p.id} product={p} index={i} format={num} />)}
        </div>
      </div>
    </section>
  )
}

/* ─── 06 · Steps ────────────────────────────────────────────── */

async function StepsSection() {
  const steps = [
    { n: '01', title: 'أنشئ حسابك', desc: 'سجّل مجانًا كمشترٍ أو مبدع في دقيقة واحدة.' },
    { n: '02', title: 'ارفع منتجاتك', desc: 'أضف ملفاتك الرقمية، حدّد السعر، وانشر منتجك.' },
    { n: '03', title: 'ابدأ البيع', desc: 'تابع الطلبات والأرباح من لوحة تحكمك مباشرة.' },
  ]
  return (
    <section className="py-16 sm:py-24 bg-white border-y border-gray-200/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead no="06" overline="رحلتك" title="كيف تبدأ؟" desc="ثلاث خطوات تفصلك عن بيع منتجاتك الأولى." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, idx) => (
            <div key={s.n} className="relative rounded-3xl border border-gray-200/80 bg-[var(--bg)] p-8 overflow-hidden hover:-translate-y-1 transition-transform duration-300">
              <span className="ghost-ink absolute -top-3 left-3 text-[88px] font-black tabular-nums select-none" dir="ltr" aria-hidden="true">
                {s.n}
              </span>
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 -left-3 w-6 border-t-2 border-dashed border-gray-300" />
              )}
              <div className="relative">
                <div className="inline-flex items-center justify-center h-11 w-11 rounded-2xl brand-gradient text-white font-black shadow-[0_12px_24px_-12px_rgba(37,78,219,0.7)]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {idx === 0 && <path strokeLinecap="round" strokeLinejoin="round" d="M18 9a3 3 0 00-3-3h-3a3 3 0 00-3 3v3m9-1a3 3 0 11-6 0m6-2h.01M6 21h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />}
                    {idx === 1 && <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M9 7h8v8" />}
                    {idx === 2 && <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />}
                  </svg>
                </div>
                <h3 className="mt-5 text-xl font-extrabold text-[var(--ink)]">{s.title}</h3>
                <p className="mt-2 text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── 05 · Features spec grid ───────────────────────────────── */

async function FeaturesSection() {
  const features = [
    { title: 'متجرك الخاص', desc: 'متجر مخصص بهويتك في الواجهة وتفضيلاتك في الظهور.', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1' },
    { title: 'عمولة عادلة', desc: 'نسبة شفافة وواضحة مع سحب أرباحك وقتما تشاء.', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
    { title: 'توصيل فوري', desc: 'تسليم الملفات الرقمية فور تأكيد الشراء.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { title: 'سوق جزائري', desc: 'بالدينار الجزائري وبواجهة كاملة بالعربية.', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { title: 'إحصائيات متقدمة', desc: 'متابعة الطلبات والأرباح والعملاء في لوحة واحدة.', icon: 'M4 19V5m4 14V9m4 10v-7m4 7V6m4 7v6' },
    { title: 'دعم أولوية', desc: 'فريق دعم يرد عليك بسرعة ويواكب كل استفسار.', icon: 'M18.364 5.636a9 9 0 11-12.728 0M12 7v4m0 4h.01' },
  ]
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          no="07"
          overline="المميزات"
          title="لماذا R2 - PLATFORM؟"
          desc="كل ما تحتاجه لبيع منتجاتك الرقمية في مكان واحد."
          action={<HeadAction href="/features">اكتشف المميزات</HeadAction>}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200/60 border border-gray-200/60 rounded-3xl overflow-hidden">
          {features.map((f) => (
            <div key={f.title} className="group flex flex-col gap-4 bg-white p-7 hover:bg-[var(--primary-soft)]/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] text-[var(--primary-strong)] border border-gray-200 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
                  </svg>
                </div>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-[var(--primary-strong)] rtl:rotate-180 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[var(--ink)]">{f.title}</h3>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Trust + testimonials (navy band) ──────────────────────── */

async function TestimonialsSection() {
  const testimonials = await getCachedTestimonials()
  if (testimonials.length === 0) return null
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {testimonials.map((t: HomeTestimonial) => (
        <figure key={t.id} className="rounded-3xl border border-gray-200 bg-[var(--bg)] p-7 flex flex-col relative overflow-hidden">
          <span className="absolute -top-4 left-4 text-8xl font-black text-[var(--a-200)]/50 select-none" aria-hidden="true">”</span>
          <div className="flex items-center gap-1 text-[var(--gold)] mb-4" aria-label={`التقييم ${t.rating} من 5`}>
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} className={`w-4 h-4 ${s <= t.rating ? 'fill-[var(--gold)]' : 'fill-gray-200'}`} viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <blockquote className="text-gray-600 leading-relaxed text-[15px] flex-1">“{t.text}”</blockquote>
          <figcaption className="mt-5 pt-4 border-t border-gray-200 text-sm">
            <span className="font-bold text-[var(--ink)]">{t.user?.name || 'مشتري'}</span>
            <span className="text-gray-300 mx-2">·</span>
            <Link href={`/product/${t.product?.slug}`} className="text-[var(--primary-strong)] font-semibold hover:underline">{t.product?.title}</Link>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

async function TrustBand() {
  const guarantees = [
    { title: 'استرداد خلال 7 أيام', desc: 'ضمان استرداد واضح وفق سياسة الاسترجاع لكل سلة مشتريات.', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { title: 'دفع آمن عبر CCP', desc: 'تحويل بنكي عبر CCP موثّق مع تأكيد تلقائي للطلبات وتتبّع واضح.', icon: 'M3 10h18M7 15h3m-5 4h12a2 2 0 002-2V8a2 2 0 00-2-2H7a2 2 0 00-2 2v9zm0 0H4a2 2 0 00-2 2v1h20v-1a2 2 0 00-2-2h-1' },
    { title: 'تسليم فوري', desc: 'الملفات الرقمية تُسلَّم فورًا بعد تأكيد الشراء عبر روابط آمنة ومباشرة.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ]
  return (
    <section className="py-16 sm:py-24 bg-white border-y border-gray-200/70">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Overline className="text-[var(--primary-strong)]">الثقة</Overline>
          <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-[var(--ink)] display-tight">
            تسوّق بثقة وادفع كما تُحب
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {guarantees.map((g) => (
            <div key={g.title} className="flex gap-4 rounded-2xl border border-gray-200 bg-[var(--bg)] p-5">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-[var(--primary-soft)] text-[var(--primary-strong)] flex items-center justify-center border border-gray-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={g.icon} />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[var(--ink)]">{g.title}</h3>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Suspense fallback={
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => <div key={i} className="rounded-3xl border border-gray-200 bg-[var(--bg)] h-44 animate-pulse" />)}
          </div>
        }>
          <div className="mt-10">
            <TestimonialsSection />
          </div>
        </Suspense>
      </div>
    </section>
  )
}

/* ─── Creator band ──────────────────────────────────────────── */

async function CreatorBandSection() {
  const settings = await getPlatformSettings()
  const promo = getPromoPlanPrices(settings, false)
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="brand-gradient relative overflow-hidden rounded-[2.5rem] px-8 py-14 sm:px-14 sm:py-16 shadow-[0_40px_90px_-40px_rgba(29,63,200,0.8)] border border-white/10">
          <span className="ghost-text ghost-text-dim absolute -top-8 left-0 text-[140px] sm:left-6 font-black select-none" aria-hidden="true">R2</span>
          <div className="absolute inset-0 opacity-[0.06] dot-grid" aria-hidden="true" />
          <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl bg-white/10" aria-hidden="true" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <Overline className="text-[var(--a-200)]">
                <span>وصل إلى آلاف المشترين</span>
              </Overline>
              <h2 className="mt-3 text-3xl sm:text-5xl font-black text-white display-tight leading-tight">
                أطلق متجرك الرقمي وابدأ البيع اليوم
              </h2>
              <p className="mt-5 text-lg text-blue-100 leading-relaxed max-w-lg">
                منتجات غير محدودة، كوبونات، إحصائيات، وتسويق بالعمولة. وأنت تتحكم في تخفيض أسعار اشتراكك بنفسك.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/auth/become-creator" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-[var(--a-900)] font-bold text-lg shadow-[0_16px_30px_-14px_rgba(0,0,0,0.4)] hover:bg-blue-50 hover:-translate-y-0.5 transition-all">
                  افتح متجرك
                  <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link href="/features" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/40 text-white font-bold hover:bg-white/10 transition-colors">
                  اكتشف المميزات
                </Link>
              </div>
            </div>
            <div className="rounded-3xl bg-white/10 border border-white/25 p-7 sm:p-9 backdrop-blur">
              <div className="flex items-start justify-between mb-6">
                <span className="text-sm font-bold text-blue-100">برو — أول شهر</span>
                <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold border border-white/25">
                  {promo.active && promo.first.discount > 0 ? `عرض ${promo.first.discount}%` : 'الأفضل للبدء'}
                </span>
              </div>
              <div className="mb-2">
                {promo.first.original > promo.first.price && (
                  <span className="block text-lg text-blue-200/70 line-through">{num(promo.first.original)} دج</span>
                )}
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-bold text-white tabular-nums">{num(promo.first.price)}</span>
                  <span className="text-blue-100 pb-2">دج</span>
                </div>
              </div>
              <p className="text-blue-100 text-sm mb-7">ثم {num(promo.renew.price)} دج شهريًا للتجديد{promo.renew.discount > 0 ? ` — خصم ${promo.renew.discount}%` : ''}.</p>
              <ul className="space-y-3 text-white text-sm">
                {['منتجات غير محدودة', 'كوبونات وتسويق بالعمولة', 'إحصائيات وأرباح فورية', 'دعم أولوية 24/7'].map((li) => (
                  <li key={li} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {li}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── 06 · FAQ teaser ─────────────────────────────────────── */

const HOME_FAQS = [
  { q: 'كيف أفتح متجرًا؟', a: 'أنشئ حسابًا مجانيًا ثم انتقل إلى "متجري" في لوحة التحكم. املأ بيانات متجرك وابدأ بإضافة منتجاتك في دقائق.' },
  { q: 'ما هي العمولة المفروضة؟', a: 'نفرض نسبة عمولة بسيطة على كل عملية بيع. يمكنك الاطلاع على النسبة الحالية في صفحة الأسعار.' },
  { q: 'كيف أستلم أرباحي؟', a: 'تتراكم أرباحك في رصيدك المتاح، ويمكنك طلب السحب عبر تحويل بنكي أو CCP أو محفظة إلكترونية.' },
  { q: 'هل تدعمون الدفع بالدينار الجزائري؟', a: 'نعم، الدفع بالدينار الجزائري (دج) مدعوم حاليًا، مع قابلية إضافة عملات أخرى.' },
  { q: 'ماذا يحدث بعد شراء العميل؟', a: 'يتم تأكيد الدفع آليًا، إضافة المنتج إلى مكتبة المشتري، وإشعارك بالبيع فورًا.' },
]

function FaqSection() {
  return (
    <section className="py-16 sm:py-24 bg-white border-y border-gray-200/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          no="08"
          overline="الأسئلة الشائعة"
          title="عندك سؤال؟"
          desc="إجابات مختصرة عن أكثر ما يسأل عنه المبدعون والمشترون."
          action={<HeadAction href="/faq">كل الأسئلة</HeadAction>}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            {HOME_FAQS.slice(0, 3).map((f, i) => (
              <details key={f.q} className="group rounded-2xl border border-gray-200/80 bg-[var(--bg)] open:bg-white open:shadow-[var(--shadow-md)] transition-all" {...(i === 0 ? { open: true } : {})}>
                <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none font-bold text-[var(--ink)]">
                  <span className="flex items-center gap-3">
                    <span className="ghost-ink text-lg font-extrabold select-none w-7 text-left" dir="ltr" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    {f.q}
                  </span>
                  <svg className="w-5 h-5 shrink-0 text-gray-400 group-open:rotate-180 group-open:text-[var(--primary-strong)] transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 pr-14 text-gray-500 text-sm leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="space-y-3">
            {HOME_FAQS.slice(3).map((f, i) => (
              <details key={f.q} className="group rounded-2xl border border-gray-200/80 bg-[var(--bg)] open:bg-white open:shadow-[var(--shadow-md)] transition-all">
                <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none font-bold text-[var(--ink)]">
                  <span className="flex items-center gap-3">
                    <span className="ghost-ink text-lg font-extrabold select-none w-7 text-left" dir="ltr" aria-hidden="true">{String(i + 4).padStart(2, '0')}</span>
                    {f.q}
                  </span>
                  <svg className="w-5 h-5 shrink-0 text-gray-400 group-open:rotate-180 group-open:text-[var(--primary-strong)] transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 pr-14 text-gray-500 text-sm leading-relaxed">{f.a}</p>
              </details>
            ))}
            <Link href="/contact" className="flex items-center justify-between gap-4 p-5 rounded-2xl brand-gradient text-white font-bold hover:brightness-110 transition-all">
              <span>ما زال عندك سؤال؟ تواصل معنا</span>
              <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Final CTA ───────────────────────────────────────────── */

function FinalCtaSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-[var(--section-tint)] to-white px-8 py-14 sm:px-14 text-center border border-gray-200 shadow-[var(--shadow-lg)]">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full blur-3xl opacity-70" style={{ background: 'radial-gradient(circle, rgba(59,109,246,0.18) 0%, transparent 65%)' }} aria-hidden="true" />
          <div className="relative">
            <Overline className="text-[var(--primary-strong)] justify-center">
              <span>انضم لآلاف المبدعين والمشترين</span>
            </Overline>
            <h2 className="mt-4 text-3xl sm:text-5xl font-black text-[var(--ink)] display-tight">
              جاهز تبدأ رحلتك؟
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
              حساب مجاني، متجر في دقائق، وأرباحك بالدينار الجزائري.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-lg font-bold brand-gradient text-white shadow-[0_20px_44px_-16px_rgba(37,78,219,0.85)] hover:brightness-110 hover:-translate-y-0.5 transition-all"
              >
                أنشئ حسابك مجانًا
                <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-gray-300 text-[var(--ink)] font-bold hover:border-[var(--a-400)] hover:bg-[var(--primary-soft)]/50 transition-colors"
              >
                تصفح السوق
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const sessionP = auth()

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] overflow-x-hidden">
      <HomeJsonLd />
      <Suspense fallback={<HomeHeader user={null} dashHref="/auth/register" />}>
        <HeaderUser sessionP={sessionP} />
      </Suspense>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white border-b border-gray-200/60">
        <div className="absolute -top-40 left-1/4 w-[42rem] h-[42rem] rounded-full blur-3xl opacity-70" style={{ background: 'radial-gradient(circle, rgba(59,109,246,0.16) 0%, transparent 70%)' }} aria-hidden="true" />
        <div className="absolute top-1/3 -left-24 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-70" style={{ background: 'radial-gradient(circle, rgba(37,78,219,0.10) 0%, transparent 70%)' }} aria-hidden="true" />
        <div className="absolute -bottom-40 right-1/4 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-70" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)' }} aria-hidden="true" />
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-transparent via-[var(--a-500)] to-transparent opacity-60" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-24 sm:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div className="text-center lg:text-right">
              <Overline className="text-[var(--primary-strong)]">
                <span>منصة جزائرية 100% — الدفع عبر CCP</span>
              </Overline>
              <h1 className="mt-5 text-4xl sm:text-6xl xl:text-7xl font-black text-[var(--ink)] display-tight">
                أبسط سوقٍ للبيع
                <br />
                <span className="brand-text font-black">المنتجات الرقمية</span>
                <br />
                بالدينار الجزائري
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                أنشئ متجرك في دقائق، ارفع ملفاتك، واستلم أموالك بسهولة وبدون تعقيد.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Suspense fallback={
                  <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-lg font-bold brand-gradient text-white shadow-[0_20px_44px_-16px_rgba(37,78,219,0.85)]">
                    ابدأ مجانًا
                  </Link>
                }>
                  <HeroCta sessionP={sessionP} />
                </Suspense>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-sm text-gray-500">
                {['دفع عبر CCP آمن', 'تسليم فوري', 'ضمان استرداد 7 أيام'].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {t}
                  </span>
                ))}
              </div>

              <Suspense fallback={<StatsTickerSkeleton />}>
                <StatsTicker />
              </Suspense>
            </div>

            <Suspense fallback={<HeroShowcaseSkeleton />}>
              <HeroShowcaseBoundary sessionP={sessionP} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── Categories marquee ─────────────────────────────────── */}
      <Suspense fallback={null}>
        <CategoriesMarquee />
      </Suspense>

      {/* ── 01 · Week rail ─────────────────────────────────────── */}
      <Suspense fallback={
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="h-8 w-56 rounded bg-gray-200/70 animate-pulse mb-8" />
            <RailSkeleton />
          </div>
        </section>
      }>
        <WeekRailSection />
      </Suspense>

      {/* ── 02 · Latest ────────────────────────────────────────── */}
      <Suspense fallback={
        <section className="py-16 sm:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="h-8 w-56 rounded bg-gray-200/70 animate-pulse mb-8" />
            <RailSkeleton />
          </div>
        </section>
      }>
        <LatestSection />
      </Suspense>

      {/* ── 03 · Top downloads ─────────────────────────────────── */}
      <Suspense fallback={
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="h-8 w-56 rounded bg-gray-200/70 animate-pulse mb-8" />
          </div>
        </section>
      }>
        <TopDownloadsSection />
      </Suspense>

      {/* ── 04 · Steps ─────────────────────────────────────────── */}
      <StepsSection />

      {/* ── 05 · Features ──────────────────────────────────────── */}
      <FeaturesSection />

      {/* ── Trust + testimonials ───────────────────────────────── */}
      <TrustBand />

      {/* ── 04 · Creators ──────────────────────────────────────── */}
      <Suspense fallback={
        <section className="py-16 sm:py-24 bg-white border-y border-gray-200/70">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="h-8 w-56 rounded bg-gray-200/70 animate-pulse mb-8" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-2xl border border-gray-200 bg-[var(--bg)] p-5">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gray-200/70 animate-pulse" />
                  <div className="mt-3 h-3 w-4/5 mx-auto rounded bg-gray-200/70 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </section>
      }>
        <CreatorsSection />
      </Suspense>

      {/* ── 05 · Free picks ────────────────────────────────────── */}
      <Suspense fallback={
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="h-8 w-56 rounded bg-gray-200/70 animate-pulse mb-8" />
            <RailSkeleton />
          </div>
        </section>
      }>
        <FreeSection />
      </Suspense>

      {/* ── Creator band ───────────────────────────────────────── */}
      <Suspense fallback={
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[2.5rem] px-8 py-14 sm:px-14 sm:py-16 bg-gradient-to-br from-[var(--a-600)] to-[var(--a-950)] animate-pulse" />
          </div>
        </section>
      }>
        <CreatorBandSection />
      </Suspense>

      {/* ── 06 · FAQ ───────────────────────────────────────────── */}
      <FaqSection />

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <FinalCtaSection />

      {/* ── Footer ─────────────────────────────────────────────── */}
      <Footer />
    </div>
  )
}

function MobileShowcase({ strip }: { strip: HeroStripItem[] }) {
  if (strip.length === 0) return null
  return (
    <div className="lg:hidden mt-10 -mx-4 px-4">
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3">
        {strip.slice(0, 6).map((p) => {
          const cover = p.thumbnail || p.images?.[0]?.url
          return (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              className="snap-start shrink-0 w-56 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-[var(--shadow-md)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[var(--primary-soft)]">
                {cover ? (
                  <SmartImage src={cover} alt={p.title} className="object-cover" sizes="224px" />
                ) : (
                  <div className="absolute inset-0 brand-gradient" />
                )}
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-bold text-white bg-black/35 border border-white/20 backdrop-blur">
                  {p.isFree ? 'مجاني' : 'متوفر الآن'}
                </span>
              </div>
              <div className="p-3.5">
                <p className="text-sm font-bold text-[var(--ink)] line-clamp-1">{p.title}</p>
                <p className="mt-1 text-sm font-extrabold tabular-nums text-[var(--primary-strong)]">
                  {p.isFree ? 'مجاني' : `${num(p.price)} دج`}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

async function HeroShowcaseBoundary({ sessionP }: { sessionP: SessionPromise }) {
  await sessionP
  const strip = await getCachedWeekStrip()
  return (
    <>
      <HeroShowcase strip={strip} />
      <MobileShowcase strip={strip} />
    </>
  )
}