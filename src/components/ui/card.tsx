import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function Card({ className, hover, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200/80 bg-white shadow-[var(--shadow-sm)]',
        'hover:shadow-[0_18px_40px_-16px_rgba(15,52,73,0.22)]',
        hover && 'transition-all duration-200 hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-6 border-b border-gray-100', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-6', className)} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-6 border-t border-gray-100', className)} {...props} />
}
