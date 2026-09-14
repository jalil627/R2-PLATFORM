import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()
    if (!token || !password) {
      return NextResponse.json({ success: false, error: 'بيانات غير صحيحة' }, { status: 400 })
    }
    if (String(password).length < 8) {
      return NextResponse.json({ success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 })
    }

    const reset = await prisma.passwordResetToken.findUnique({ where: { token } })
    if (!reset || reset.used || reset.expires < new Date()) {
      return NextResponse.json({ success: false, error: 'الرابط غير صالح أو منتهي' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(String(password), 10)
    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: reset.id }, data: { used: true } }),
    ])

    return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' })
  } catch (error) {
    console.error('[Reset Password]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
