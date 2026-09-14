import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db'
import { canAccessSection, getSessionUser } from '@/lib/auth/permissions'
import { parsePagination } from '@/lib/utils'
import { raiseAlert } from '@/lib/alerts'

const TYPES = ['SALE', 'PLATFORM_FEE', 'PAYMENT_FEE', 'SELLER_EARNING', 'REFUND', 'PAYOUT', 'ADJUSTMENT'] as const

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    if (!sessionUser || !canAccessSection(sessionUser.role, 'treasury')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const { page, pageSize, skip } = parsePagination(searchParams, { defaultPageSize: 20, maxPageSize: 100 })
    const type = searchParams.get('type') || ''
    const search = searchParams.get('q') || ''
    const month = searchParams.get('month') || ''

    const where: Prisma.TransactionWhereInput = {}
    if (type && (TYPES as readonly string[]).includes(type)) {
      where.type = type as (typeof TYPES)[number]
    }
    if (/^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number)
      const from = new Date(y, m - 1, 1)
      const to = new Date(y, m, 1)
      where.createdAt = { gte: from, lt: to }
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { orderId: { contains: search } },
      ]
    }

    const since = new Date()
    since.setMonth(since.getMonth() - 5, 1)
    since.setHours(0, 0, 0, 0)

    const [groups, transactions, total, recent, pendingPayouts, paidPayouts] = await Promise.all([
      prisma.transaction.groupBy({ by: ['type'], _sum: { amount: true }, _count: { _all: true } }),
      prisma.transaction.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where: { createdAt: { gte: since } },
        select: { type: true, amount: true, createdAt: true },
      }),
      prisma.payout.aggregate({
        where: { status: { in: ['REQUESTED', 'PENDING', 'PROCESSING'] } },
        _sum: { amount: true },
      }),
      prisma.payout.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    ])

    const byType = groups.map((g) => ({ type: g.type, total: g._sum.amount || 0, count: g._count._all }))
    const inflow = byType.filter((t) => t.total > 0).reduce((s, t) => s + t.total, 0)
    const outflow = byType.filter((t) => t.total < 0).reduce((s, t) => s + Math.abs(t.total), 0)

    // Last 6 calendar months, oldest → newest
    const months: { key: string; label: string; in: number; out: number }[] = []
    const cursor = new Date(since.getFullYear(), since.getMonth(), 1)
    const labels = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    for (let i = 0; i < 6; i++) {
      months.push({ key: monthKey(cursor), label: labels[cursor.getMonth()], in: 0, out: 0 })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    for (const t of recent) {
      const m = months.find((x) => x.key === monthKey(t.createdAt))
      if (!m) continue
      if (t.amount >= 0) m.in += t.amount
      else m.out += Math.abs(t.amount)
    }

    return NextResponse.json({
      success: true,
      data: {
        byType,
        inflow,
        outflow,
        net: inflow - outflow,
        pendingPayouts: pendingPayouts._sum.amount || 0,
        paidPayouts: paidPayouts._sum.amount || 0,
        monthly: months,
        transactions,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('[Admin Treasury GET]', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUser = getSessionUser(session)
    // Manual adjustments move real money on the ledger — SUPER_ADMIN only.
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const amount = Number(body?.amount)
    const description = typeof body?.description === 'string' ? body.description.trim().slice(0, 500) : ''

    if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 100_000_000) {
      return NextResponse.json({ success: false, error: 'المبلغ غير صالح' }, { status: 400 })
    }
    if (!description) {
      return NextResponse.json({ success: false, error: 'سبب التسوية مطلوب' }, { status: 400 })
    }

    const tx = await prisma.transaction.create({
      data: {
        type: 'ADJUSTMENT',
        userId: sessionUser.id,
        amount,
        currency: 'DZD',
        description,
        metadata: { by: sessionUser.id, at: new Date().toISOString() } as unknown as Prisma.InputJsonValue,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: 'TREASURY_ADJUSTMENT',
        entity: 'Transaction',
        entityId: tx.id,
        newValues: { amount, description } as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({ success: true, data: tx })
  } catch (error) {
    console.error('[Admin Treasury POST]', error)
    await raiseAlert('critical', 'فشل تسوية خزينة', error instanceof Error ? error.message : 'unknown', '/admin/treasury')
    return NextResponse.json({ success: false, error: 'حدث خطأ ما' }, { status: 500 })
  }
}
