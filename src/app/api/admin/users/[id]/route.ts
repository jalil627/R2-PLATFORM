import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { ensureCreatorProfile } from '@/lib/plans'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'

const ALLOWED_ROLES = ['BUYER', 'CREATOR', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'users')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { role, isBanned, banReason, isActive, plan, planDays, memberNo } = body
    const sessionRole = sessionUser.role
    const sessionUserId = sessionUser.id

    if (id === sessionUserId && role !== undefined) {
      return NextResponse.json({ success: false, error: 'لا يمكنك تغيير دورك بنفسك' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } })
    if (!target) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
    }
    if (sessionRole !== 'SUPER_ADMIN' && (target.role === 'ADMIN' || target.role === 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'لا يمكنك تعديل حساب إداري' }, { status: 403 })
    }
    if (target.role === 'SUPER_ADMIN' && role !== undefined && role !== 'SUPER_ADMIN') {
      const superAdmins = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } })
      if (superAdmins <= 1) {
        return NextResponse.json({ success: false, error: 'لا يمكن إزالة آخر مدير عام — يجب أن يبقى مدير عام واحد على الأقل' }, { status: 400 })
      }
    }

    if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ success: false, error: 'دور غير صالح' }, { status: 400 })
    }
    if (
      role !== undefined && role !== target.role &&
      ((target.role === 'BUYER' && role === 'CREATOR') || (target.role === 'CREATOR' && role === 'BUYER'))
    ) {
      return NextResponse.json({ success: false, error: 'لا يمكن تحويل الحساب بين مشتري ومبدع مباشرة حفاظًا على البيانات — لترقية مبدع يجب أن يمر عبر طلب أن يصبح مبدعًا' }, { status: 400 })
    }
    if (role !== undefined && (role === 'SUPER_ADMIN' || role === 'ADMIN') && sessionRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'فقط المدير العام يمكنه منح أدوار الإدارة' }, { status: 403 })
    }
    if (plan !== undefined && !['FREE', 'PRO'].includes(plan)) {
      return NextResponse.json({ success: false, error: 'خطة غير صالحة' }, { status: 400 })
    }
    if (memberNo !== undefined) {
      if (memberNo === null) {
        return NextResponse.json({ success: false, error: 'الرقم لا يمكن أن يكون فارغًا — أدخل رقمًا أو اتركه كما هو' }, { status: 400 })
      }
      const n = Number(memberNo)
      if (!Number.isInteger(n) || n <= 0) {
        return NextResponse.json({ success: false, error: 'رقم العضو يجب أن يكون عددًا صحيحًا موجبًا' }, { status: 400 })
      }
    }

    let planUpdate: { plan: string; planExpiresAt: Date | null } | undefined
    if (plan !== undefined) {
      if (plan === 'PRO') {
        await ensureCreatorProfile(id)
      }
      planUpdate = {
        plan,
        planExpiresAt: plan === 'PRO'
          ? Number(planDays) > 0
            ? new Date(Date.now() + Math.round(Number(planDays)) * 86400000)
            : null
          : null,
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined && { role }),
        ...(isBanned !== undefined && { isBanned }),
        ...(banReason !== undefined && { banReason }),
        ...(isActive !== undefined && { isActive }),
        ...(memberNo !== undefined && { memberNo: Number(memberNo) }),
        ...(planUpdate && { creatorProfile: { update: planUpdate } }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        memberNo: true,
        isBanned: true,
        isActive: true,
        creatorProfile: { select: { plan: true, planExpiresAt: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: 'UPDATE_USER',
        entity: 'User',
        entityId: id,
        newValues: body as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'رقم العضو مستخدم بالفعل من قِبل مستخدم آخر' }, { status: 409 })
    }
    console.error('[Admin User PATCH]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const deleteSessionUser = getSessionUser(session)
    if (!deleteSessionUser || !canAccessSection(deleteSessionUser.role, 'users')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const adminId = deleteSessionUser.id

    if (id === adminId) {
      return NextResponse.json({ success: false, error: 'لا يمكنك حذف حسابك' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true } })
    if (!target) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
    }
    if (target.role === 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'لا يمكن حذف مشرف آخر' }, { status: 400 })
    }
    if (deleteSessionUser.role !== 'SUPER_ADMIN' && target.role === 'ADMIN') {
      return NextResponse.json({ success: false, error: 'فقط المدير العام يمكنه حذف مدير' }, { status: 403 })
    }

    try {
      await prisma.user.delete({ where: { id } })
    } catch {
      await prisma.user.update({
        where: { id },
        data: { isActive: false, isBanned: true, banReason: 'removed by admin' },
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'DELETE_USER',
        entity: 'User',
        entityId: id,
        newValues: { email: target.email, name: target.name },
      },
    })

    return NextResponse.json({ success: true, message: 'تم حذف المستخدم' })
  } catch (error) {
    console.error('[Admin User DELETE]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
