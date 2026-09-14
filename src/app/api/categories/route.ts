import { NextResponse } from 'next/server'
import { listCategories } from '@/lib/catalog'

export async function GET() {
  try {
    const categories = await listCategories()
    return NextResponse.json(
      { success: true, data: categories },
      { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' } },
    )
  } catch (error) {
    console.error('[Categories GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
