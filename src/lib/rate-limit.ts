export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

interface Bucket {
  hits: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

const DEFAULTS = {
  windowMs: 60_000,
  max: 30,
}

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export function rateLimit(
  key: string,
  opts: { windowMs?: number; max?: number } = {}
): RateLimitResult {
  const windowMs = opts.windowMs ?? DEFAULTS.windowMs
  const max = opts.max ?? DEFAULTS.max
  const now = Date.now()

  if (buckets.size > 5000) prune(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { hits: 1, resetAt: now + windowMs })
    return { ok: true, remaining: max - 1, resetAt: now + windowMs }
  }

  bucket.hits += 1
  if (bucket.hits > max) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt }
  }

  return { ok: true, remaining: max - bucket.hits, resetAt: bucket.resetAt }
}

const IP_HEADERS = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'] as const

export function clientIp(request: Request): string {
  for (const header of IP_HEADERS) {
    const value = request.headers.get(header)
    if (value) return value.split(',')[0].trim()
  }
  return 'local'
}

export function rateLimitKey(scope: string, request: Request): string {
  return `${scope}:${clientIp(request)}`
}