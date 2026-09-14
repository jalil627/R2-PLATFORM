'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap',
          {
            'text-white shadow-sm shadow-blue-600/20 brand-gradient hover:shadow-lg hover:shadow-blue-600/30 hover:brightness-110': variant === 'primary',
            'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500': variant === 'secondary',
            'border border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-800 hover:bg-blue-50/50 focus:ring-blue-500': variant === 'outline',
            'text-gray-600 hover:bg-blue-50 hover:text-blue-800 focus:ring-blue-500': variant === 'ghost',
            'bg-[var(--bad)] text-white hover:brightness-95 focus:ring-red-500': variant === 'danger',
            'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500': variant === 'success',
          },
          {
            'h-8 px-3 text-sm gap-1.5': size === 'sm',
            'h-10 px-4 text-sm gap-2': size === 'md',
            'h-12 px-6 text-base gap-2': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
          },
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
