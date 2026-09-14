import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'
import { rateLimit, rateLimitKey } from '@/lib/rate-limit'
import { reserveMemberNo } from '@/lib/member-no'

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/

function normalizeUsername(raw: string): string {
  return (raw || '').trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const rate = rateLimit(rateLimitKey('register', request), { windowMs: 60_000, max: 10 })
    if (!rate.ok) {
      return NextResponse.json({ success: false, error: 'طلبات كثيرة جدًا، حاول لاحقًا' }, { status: 429 })
    }

    const { name, username, email, password, role } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const normalizedUsername = normalizeUsername(username || String(email).split('@')[0])

    if (!USERNAME_PATTERN.test(normalizedUsername.slice(0, 20))) {
      return NextResponse.json({ success: false, error: 'اسم المستخدم يجب أن يتكون من 3 إلى 20 حرفاً (حروف، أرقام، _)' }, { status: 400 })
    }

    const accountRole = role === 'creator' ? 'CREATOR' : 'BUYER'

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: normalizedEmail }, { username: normalizedUsername }] },
    })
    if (existing) {
      if (existing.email === normalizedEmail) {
        return NextResponse.json({ success: false, error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 })
      }
      return NextResponse.json({ success: false, error: 'اسم المستخدم محجوز بالفعل' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.$transaction(async (tx) => {
      const memberNo = await reserveMemberNo(tx)

      const created = await tx.user.create({
        data: {
          name: String(name).trim(),
          email: normalizedEmail,
          username: normalizedUsername,
          passwordHash,
          memberNo,
          role: accountRole,
          profile: { create: {} },
        },
      })

      if (accountRole === 'CREATOR') {
        await tx.creatorProfile.create({
          data: {
            userId: created.id,
            commissionRate: parseFloat(process.env.PLATFORM_FEE_PERCENT || '10'),
          },
        })
        await tx.store.create({
          data: {
            userId: created.id,
            name: String(name).trim(),
            slug: normalizedUsername,
            bio: '',
          },
        })
      }

      await tx.notification.create({
        data: {
          userId: created.id,
          type: accountRole === 'CREATOR' ? 'NEW_SALE' : 'WELCOME',
          title: 'مرحبًا بك في R2 - PLATFORM!',
          message: accountRole === 'CREATOR'
            ? 'حسابك جاهز. أضف منتجك الأول وابدأ البيع.'
            : 'حسابك جاهز. ابدأ باستكشاف السوق أو فتح متجرك.',
        },
      })

      return created
    })

    return NextResponse.json({ success: true, userId: user.id })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل' }, { status: 409 })
    }
    console.error('[Register]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}