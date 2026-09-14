import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth/permissions'
import { uploadFile, getPublicImageUrl, ALLOWED_UPLOAD_FOLDERS, isPublicFolder } from '@/lib/storage'
import { rateLimit, rateLimitKey } from '@/lib/rate-limit'

const MAX_FILE_SIZE = 150 * 1024 * 1024
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest) {
  try {
    const rate = rateLimit(rateLimitKey('upload', request), { windowMs: 60_000, max: 40 })
    if (!rate.ok) {
      return NextResponse.json({ success: false, error: 'طلبات كثيرة جدًا، حاول لاحقًا' }, { status: 429 })
    }

    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = sessionUser.id
    const creator = await prisma.creatorProfile.findUnique({ where: { userId } })
    if (!creator) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'uploads'

    if (!file) {
      return NextResponse.json({ success: false, error: 'الملف مطلوب' }, { status: 400 })
    }

    if (!ALLOWED_UPLOAD_FOLDERS.includes(folder)) {
      return NextResponse.json({ success: false, error: 'مجلد الرفع غير صالح' }, { status: 400 })
    }

    const isImageFolder = isPublicFolder(folder)

    if (isImageFolder && !ALLOWED_IMAGE_MIME.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'صيغة الصورة غير مدعومة (JPG, PNG, WEBP, GIF فقط)' },
        { status: 400 },
      )
    }

    if (isImageFolder && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ success: false, error: 'حجم الصورة يتجاوز 10MB' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'حجم الملف يتجاوز 150MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadFile(buffer, file.name, folder)

    return NextResponse.json({
      success: true,
      data: {
        key: result.key,
        url: isImageFolder ? getPublicImageUrl(result.key) : result.url,
        size: result.size,
        name: file.name,
        mimeType: file.type || undefined,
      },
    })
  } catch (error) {
    console.error('[Upload]', error)
    return NextResponse.json({ success: false, error: 'فشل رفع الملف' }, { status: 500 })
  }
}