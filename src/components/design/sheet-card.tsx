import Link from 'next/link'
import SmartImage from '@/components/ui/smart-image'

const ratioByType: Record<string, string> = {
  EBOOK: 'aspect-[3/4]',
  TEMPLATE: 'aspect-[16/10]',
  COURSE: 'aspect-video',
  VIDEO: 'aspect-video',
  PDF: 'aspect-[4/3]',
  AUDIO: 'aspect-square',
}

const typeMeta: Record<string, { bg: string; label: string; icon: string }> = {
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

function TypeFallback({ type, label }: { type: string; label: string }) {
  const t = typeMeta[type] || typeMeta.RESOURCE
  return (
    <div className="w-full h-full" style={{ background: t.bg }}>
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
        <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} />
          </svg>
        </div>
        <span className="text-[10px] font-bold text-white/90 bg-black/20 px-2 py-0.5 rounded-full whitespace-nowrap">{label}</span>
      </div>
    </div>
  )
}

interface SheetProductImage {
  url: string
}

interface SheetProductCreator {
  user?: {
    name?: string | null
    username?: string | null
  } | null
}

interface SheetProduct {
  id?: string
  slug: string
  title: string
  type: string
  price: number
  thumbnail?: string | null
  images?: SheetProductImage[] | null
  isFree?: boolean
  downloadCount?: number | null
  creator?: SheetProductCreator | null
}

interface SheetCardProps {
  product: SheetProduct
  index: number
  format: (n: number) => string
}

/** Catalog "sheet" card — new editorial design used on home + marketplace. */
export default function SheetCard({ product: p, index, format }: SheetCardProps) {
  const ratio = ratioByType[p.type] || 'aspect-[4/3]'
  const type = typeMeta[p.type] || typeMeta.RESOURCE
  const cover = p.thumbnail || p.images?.[0]?.url

  return (
    <Link
      href={`/product/${p.slug}`}
      className="card-sheet group relative block rounded-2xl border border-gray-200/80 bg-white overflow-hidden hover:border-[var(--a-400)]"
    >
      {/* Index chip */}
      <span
        className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold tabular-nums backdrop-blur border border-white/30 bg-black/30 text-white shadow-lg"
        dir="ltr"
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Cover */}
      <div className={`${ratio} relative overflow-hidden bg-gray-100`}>
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          {cover ? (
            <SmartImage src={cover} alt={p.title} className="object-cover" />
          ) : (
            <TypeFallback type={p.type} label={type.label} />
          )}
        </div>

        {/* Type / free chip */}
        {p.isFree ? (
          <span className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold shadow-lg">
            مجاني
          </span>
        ) : (
          <span
            className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-lg backdrop-blur bg-black/35 border border-white/20"
          >
            {type.label}
          </span>
        )}

        {/* Buy reveal bar */}
        <div className="buy-reveal absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-l from-[var(--a-600)] to-[var(--a-900)] flex items-center justify-center gap-2 text-white text-sm font-bold">
          <span>{p.isFree ? 'حمله مجانًا' : 'اطلبه الآن'}</span>
          <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h4 className="text-[15px] font-bold text-[var(--ink)] line-clamp-1">
          {p.title}
        </h4>
        <p className="mt-1 text-xs text-gray-400 truncate">
          {p.creator?.user?.name || 'مبدع ' + (p.creator?.user?.username || '')}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          {p.isFree ? (
            <span className="text-emerald-600 text-sm font-bold">مجاني</span>
          ) : (
            <span className="text-lg font-bold tabular-nums text-[var(--primary-strong)]">
              {format(p.price)} <span className="text-xs font-medium text-gray-400">دج</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 tabular-nums">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {format(p.downloadCount || 0)}
          </span>
        </div>
      </div>
    </Link>
  )
}