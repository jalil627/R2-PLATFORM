'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }

export function StarRating({ value, onChange, readonly = false, size = 'md', className }: StarRatingProps) {
  const [hover, setHover] = useState(0)

  return (
    <div className={cn('flex items-center gap-0.5', className)} dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={cn(
            'transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer',
            sizeMap[size]
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className={cn(
              sizeMap[size],
              (hover || value) >= star ? 'fill-amber-400' : 'fill-gray-200'
            )}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  )
}
