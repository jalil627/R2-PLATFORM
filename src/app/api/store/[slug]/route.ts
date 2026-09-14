import { NextRequest, NextResponse } from 'next/server'
import { getStoreWithProducts } from '@/lib/catalog'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const result = await getStoreWithProducts(slug)

    if (!result) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 })
    }

    return NextResponse.json(
      { success: true, data: result },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
    )
  } catch (error) {
    console.error('[Store GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
