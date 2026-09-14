import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getSessionUser } from '@/lib/auth/permissions'
import { listProducts } from '@/lib/catalog'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const requestedStatus = searchParams.get('status') || ''
    const adminOnly = await (async () => {
      if (!requestedStatus) return false
      const session = await auth()
      const role = getSessionUser(session)?.role
      return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'MODERATOR'
    })()

    const params: Record<string, string> = {}
    searchParams.forEach((v, k) => {
      params[k] = v
    })
    // Non-staff can only ever see approved products, whatever they request.
    if (!adminOnly) delete params.status

    const { products, total, page, pageSize, totalPages } = await listProducts(params)

    const headers = adminOnly
      ? { 'Cache-Control': 'private, no-store' }
      : { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' }

    return NextResponse.json({
      success: true,
      data: products,
      total,
      page,
      pageSize,
      totalPages,
    }, { headers })
  } catch (error) {
    console.error('[Products GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
