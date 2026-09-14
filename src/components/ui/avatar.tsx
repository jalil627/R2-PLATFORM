import { cn } from '@/lib/utils'
import SmartImage from '@/components/ui/smart-image'

interface AvatarProps {
  src?: string | null
  alt?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-xl',
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
    'bg-cyan-500', 'bg-violet-500', 'bg-pink-500', 'bg-teal-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({ src, alt, name = '', size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <span className={cn('relative rounded-full overflow-hidden shrink-0', sizeClasses[size], className)}>
        <SmartImage src={src} alt={alt || name} className="object-cover" sizes="96px" />
      </span>
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-medium',
        getColorFromName(name),
        sizeClasses[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
