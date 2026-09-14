import Image from 'next/image'

interface SmartImageProps {
  src: string
  alt: string
  className?: string
  sizes?: string
  eager?: boolean
}

function isUnoptimizable(src: string): boolean {
  return src.startsWith('blob:') || src.startsWith('data:')
}

/**
 * Optimized image with a safe fallback.
 * - Same-origin and allow-listed remote URLs go through next/image (fill mode,
 *   so the parent must be positioned, e.g. `relative`).
 * - `blob:` / `data:` preview URLs (used by upload forms) fall back to <img>
 *   because the Next optimizer cannot handle them.
 */
export default function SmartImage({ src, alt, className, sizes, eager }: SmartImageProps) {
  if (!src) return null
  if (isUnoptimizable(src)) {
    // eslint-disable-next-line @next/next/no-img-element -- optimizer cannot handle blob:/data: URLs
    return <img src={src} alt={alt} className={className} loading={eager ? 'eager' : 'lazy'} />
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
    />
  )
}
