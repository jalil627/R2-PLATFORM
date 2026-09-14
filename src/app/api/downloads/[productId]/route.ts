import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { getSignedDownloadUrl } from '@/lib/storage'

export async function GET(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = sessionUser.id
    const { productId } = await params

    const order = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { buyerId: userId, status: 'PAID' },
      },
      include: { product: { include: { files: true } } },
    })

    if (!order) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const product = order.product
    if (!product.files.length) {
      return NextResponse.json({ error: 'No files available' }, { status: 404 })
    }

    const file = product.files[0]
    const fileKey = file.url
      .replace(process.env.S3_PUBLIC_URL || '', '')
      .replace(/^local:\/\//, '')
      .replace(/^\//, '')

    const signedUrl = await getSignedDownloadUrl(fileKey, 3600)

    await prisma.download.create({
      data: {
        userId,
        productId,
        fileId: file.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json({ success: true, data: { url: signedUrl, fileName: file.name } })
  } catch (error) {
    console.error('[Download]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
