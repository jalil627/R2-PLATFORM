import { NextRequest, NextResponse } from 'next/server'
import { readLocalFile, getContentType, isStorageConfigured, PUBLIC_FOLDERS } from '@/lib/storage'
import { rateLimit, rateLimitKey } from '@/lib/rate-limit'
import path from 'path'

// Public images only — paid deliverables ('uploads') must never be served here;
// they are gated by purchase and delivered via signed URLs in /api/downloads.
const ALLOWED_FOLDERS: readonly string[] = PUBLIC_FOLDERS
const MAX_IMAGE_AGE = 60 * 60 * 24 * 30

export async function GET(request: NextRequest) {
  const rate = rateLimit(rateLimitKey('assets', request), { windowMs: 30_000, max: 60 })
  if (!rate.ok) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key') || ''

  const safe = path.normalize(key).replace(/\\/g, '/').replace(/^\/+/, '')
  const folder = safe.split('/')[0]
  if (!safe || !ALLOWED_FOLDERS.includes(folder) || safe.includes('..')) {
    return new NextResponse('Not Found', { status: 404 })
  }

  if (isStorageConfigured()) {
    return new NextResponse('Not Found', { status: 404 })
  }

  try {
    const buffer = await readLocalFile(safe)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': getContentType(path.extname(safe)),
        'Cache-Control': `public, max-age=${MAX_IMAGE_AGE}, immutable`,
        'X-Content-Type-Options': 'nosniff',
        // Served bytes are never trusted as code (e.g. a crafted SVG opened
        // directly must not execute scripts in the site origin).
        'Content-Security-Policy': 'sandbox',
      },
    })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: unknown }).code === 'ENOENT') {
      return new NextResponse('Not Found', { status: 404 })
    }
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}