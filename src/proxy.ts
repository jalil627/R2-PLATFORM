import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type Bucket = { count: number; reset: number }
const WINDOW_MS = 10_000
const buckets = new Map<string, Bucket>()

const LIMITS: Record<string, number> = {
  auth: 10, // /api/auth/* (تسجيل الدخول والكوبونات الحساسة)
  page: 60, // صفحات /auth/* (نموذج الدخول والتسجيل)
  api: 150, // بقية مسارات /api/*
}

function clientKey(request: NextRequest, group: string): string {
  const xff = request.headers.get('x-forwarded-for')
  const ip = xff ? xff.split(',')[0].trim() : 'unknown'
  return `${group}:${ip}`
}

function allow(request: NextRequest, group: string): boolean {
  const now = Date.now()
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now > v.reset) buckets.delete(k)
    }
  }
  const k = clientKey(request, group)
  const b = buckets.get(k)
  if (!b || now > b.reset) {
    buckets.set(k, { count: 1, reset: now + WINDOW_MS })
    return true
  }
  b.count += 1
  return b.count <= LIMITS[group]
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  let allowed = true
  if (pathname.startsWith('/api/auth')) {
    allowed = allow(request, 'auth')
  } else if (pathname.startsWith('/auth')) {
    allowed = allow(request, 'page')
  } else if (pathname.startsWith('/api')) {
    allowed = allow(request, 'api')
  }

  if (!allowed) {
    const msg = 'طلبات كثيرة جدًا. حاول بعد قليل.'
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ success: false, error: msg }, { status: 429, headers: { 'Retry-After': '10' } })
    }
    return new NextResponse(msg, { status: 429, headers: { 'Retry-After': '10' } })
  }

  const response = NextResponse.next()
  if (pathname.startsWith('/api/auth')) {
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('Pragma', 'no-cache')
  }
  return response
}

export const config = {
  matcher: ['/api/:path*', '/auth/:path*'],
}