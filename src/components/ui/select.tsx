'use client'

import { forwardRef, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full h-10 px-3 rounded-lg border bg-white text-gray-900',
            'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600',
            '',
            'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
            error ? 'border-blue-500 focus:ring-blue-500' : 'border-gray-300',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-blue-500">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
