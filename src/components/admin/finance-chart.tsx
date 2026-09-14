'use client'

import { useState } from 'react'

export interface FlowMonth {
  key: string
  label: string
  in: number
  out: number
}

interface FinanceChartProps {
  months: FlowMonth[]
  height?: number
  selectedKey?: string | null
  onSelect?: (key: string | null) => void
  currency?: (n: number) => string
}

/** Paired in/out bars, pure SVG — hover tooltips + click-to-filter, no chart dependency. */
export default function FinanceChart({ months, height = 180, selectedKey, onSelect, currency }: FinanceChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const fmt = currency || ((n: number) => `${n.toLocaleString('ar-DZ')} دج`)

  const max = Math.max(1, ...months.flatMap((m) => [m.in, m.out]))
  const W = 560
  const H = height
  const padB = 26
  const plotH = H - padB
  const n = Math.max(1, months.length)
  const slot = W / n
  const barW = Math.min(26, slot / 3.2)

  const hoveredMonth = hovered !== null ? months[hovered] : null
  const tipLeft = hovered !== null ? ((slot * hovered + slot / 2) / W) * 100 : 0

  return (
    <div dir="ltr">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="التدفق المالي الشهري">
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1={0}
              x2={W}
              y1={plotH - plotH * f}
              y2={plotH - plotH * f}
              stroke="currentColor"
              strokeOpacity={0.08}
              strokeDasharray="3 4"
            />
          ))}
          {months.map((m, i) => {
            const cx = slot * i + slot / 2
            const hIn = Math.max(3, (m.in / max) * plotH)
            const hOut = Math.max(3, (m.out / max) * plotH)
            const selected = selectedKey === m.key
            const dimmed = selectedKey != null && !selected
            return (
              <g
                key={m.key}
                opacity={dimmed ? 0.35 : 1}
                style={{ cursor: onSelect ? 'pointer' : 'default' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect?.(selected ? null : m.key)}
              >
                <rect x={slot * i + 2} y={0} width={slot - 4} height={plotH} fill="transparent" />
                <rect
                  x={cx - barW - 3}
                  y={plotH - hIn}
                  width={barW}
                  height={hIn}
                  rx={5}
                  className="fill-emerald-500"
                  opacity={hovered === i || selected ? 1 : 0.9}
                  stroke={selected ? '#059669' : 'none'}
                  strokeWidth={selected ? 2 : 0}
                />
                <rect
                  x={cx + 3}
                  y={plotH - hOut}
                  width={barW}
                  height={hOut}
                  rx={5}
                  className="fill-rose-500"
                  opacity={hovered === i || selected ? 1 : 0.85}
                  stroke={selected ? '#e11d48' : 'none'}
                  strokeWidth={selected ? 2 : 0}
                />
                <text x={cx} y={H - 8} textAnchor="middle" fontSize={11} className="fill-gray-400">
                  {m.label}
                </text>
              </g>
            )
          })}
        </svg>
        {hoveredMonth && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl bg-gray-900 text-white text-xs px-3 py-2 shadow-xl whitespace-nowrap"
            style={{ left: `${Math.min(88, Math.max(12, tipLeft))}%`, top: 0 }}
          >
            <p className="font-black mb-1">{hoveredMonth.label}</p>
            <p className="tabular-nums text-emerald-300">داخل: {fmt(hoveredMonth.in)}</p>
            <p className="tabular-nums text-rose-300">خارج: {fmt(hoveredMonth.out)}</p>
            <p className="tabular-nums text-white/80">الصافي: {fmt(hoveredMonth.in - hoveredMonth.out)}</p>
            {onSelect && <p className="mt-1 text-white/50">انقر للفلترة بهذا الشهر</p>}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-center gap-5 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> داخل
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> خارج
        </span>
      </div>
    </div>
  )
}
