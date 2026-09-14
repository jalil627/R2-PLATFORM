import { cn } from '@/lib/utils'
import SmartImage from '@/components/ui/smart-image'

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

export function getProductType(type: string) {
  return typeCover[type] || typeCover.RESOURCE
}

interface TypeBadgeProps {
  type: string
  iconSize?: number
  className?: string
  showLabel?: boolean
}

export function TypeFallbackIcon({ type, iconSize = 24, className, showLabel = true }: TypeBadgeProps) {
  const t = getProductType(type)
  return (
    <div className={cn('w-full h-full flex flex-col items-center justify-center gap-2 p-2', className)} style={{ background: t.bg }}>
      <div className="rounded-xl bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur" style={{ width: iconSize + 12, height: iconSize + 12 }}>
        <svg className="text-white" style={{ width: iconSize, height: iconSize }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} />
        </svg>
      </div>
      {showLabel && <span className="text-[10px] font-bold text-white/90 bg-black/20 px-2 py-0.5 rounded-full whitespace-nowrap">{t.label}</span>}
    </div>
  )
}

interface ProductCoverProps {
  product: { thumbnail?: string | null; images?: { url: string }[] | null; type: string }
  ratio?: string
  className?: string
}

export default function ProductCover({ product, className }: ProductCoverProps) {
  const cover = product.thumbnail || product.images?.[0]?.url
  if (cover) {
    return (
      <span className={cn('relative block w-full h-full overflow-hidden', className)}>
        <SmartImage src={cover} alt={product.type} className="object-cover" />
      </span>
    )
  }
  return <TypeFallbackIcon type={product.type} className={className} />
}
