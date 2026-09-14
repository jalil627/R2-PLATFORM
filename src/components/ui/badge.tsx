import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
}

const VARIANTS: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200',
  success: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  info: 'bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200',
  outline: 'border border-gray-300 text-gray-700',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight',
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  )
}