import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { verifyDownloadSignature, readLocalFile, getContentType } from '@/lib/storage'

const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 30
const rateBuckets = new Map<string, { count: number; resetAt: number }>()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const bucket = rateBuckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }
  bucket.count += 1
  return bucket.count > RATE_LIMIT_MAX
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  if (rateLimited(`serve:${ip}`)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  const exp = Number(searchParams.get('exp') || 0)
  const sig = searchParams.get('sig') || ''

  if (!key || !exp || !sig) {
    return NextResponse.json({ error: 'Invalid download link' }, { status: 400 })
  }

  if (!verifyDownloadSignature(key, exp, sig)) {
    return NextResponse.json({ error: 'Invalid or expired download link' }, { status: 403 })
  }

  const normalized = key.replace(/\\/g, '/')
  if (normalized.includes('..') || normalized.startsWith('/')) {
    return NextResponse.json({ error: 'Invalid download link' }, { status: 403 })
  }

  try {
    const buffer = await readLocalFile(normalized)
    const ext = path.extname(normalized)
    const suggestedName = path.basename(normalized)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': getContentType(ext),
        'Content-Length': String(buffer.length),
        'Content-Disposition': `attachment; filename="${suggestedName}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}