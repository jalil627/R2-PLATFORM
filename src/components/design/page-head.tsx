import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Overline({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('overline-label inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest text-[var(--primary-strong)]', className)}>
      <span className="h-px w-6 bg-[var(--a-500)]" />
      {children}
    </p>
  )
}

interface PageHeroProps {
  index?: string
  overline: string
  title: ReactNode
  description?: string
  children?: ReactNode
}

export default function PageHero({ index, overline, title, description, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[var(--section-tint)] to-[var(--bg)] border-b border-gray-200/60">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(60rem 30rem at 90% -10%, rgba(59,109,246,0.12) 0%, transparent 55%), radial-gradient(45rem 25rem at 0% 110%, rgba(37,78,219,0.10) 0%, transparent 55%)',
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            {index && (
              <span aria-hidden="true" className="ghost-ink block font-extrabold leading-none tracking-tighter select-none text-[64px] sm:text-7xl md:text-8xl mb-3">
                {index}
              </span>
            )}
            <p className="overline-label inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest mb-4 text-[var(--primary-strong)]">
              <span className="h-px w-6 bg-[var(--a-500)]" />
              {overline}
            </p>
            <h1 className="display-tight text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-[var(--ink)]">
              {title}
            </h1>
            {description && (
              <p className="mt-4 text-base sm:text-lg leading-relaxed max-w-xl text-gray-500">
                {description}
              </p>
            )}
          </div>
          {children && <div className="flex items-end gap-3">{children}</div>}
        </div>
      </div>
    </section>
  )
}

export function SectionHead({
  index,
  overline,
  title,
  description,
  anchor,
}: {
  index: string
  overline: string
  title: string
  description?: string
  anchor?: string
}) {
  return (
    <div className={cn('mb-8', anchor && 'scroll-mt-32')} id={anchor}>
      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="ghost-ink text-5xl sm:text-6xl font-extrabold leading-none tracking-tighter select-none">
          {index}
        </span>
        <div>
          <Overline>{overline}</Overline>
          <h2 className="display-tight mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
            {title}
          </h2>
        </div>
      </div>
      {description && <p className="mt-3 max-w-2xl text-sm sm:text-base text-gray-500 leading-relaxed">{description}</p>}
    </div>
  )
}