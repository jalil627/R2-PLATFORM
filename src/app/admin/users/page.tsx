'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const roleMap: Record<string, { label: string; variant: 'info' | 'primary' | 'danger' | 'warning' | 'default' }> = {
  BUYER: { label: 'مشتري', variant: 'default' },
  CREATOR: { label: 'مبدع', variant: 'primary' },
  MODERATOR: { label: 'مشرف', variant: 'info' },
  ADMIN: { label: 'مدير', variant: 'warning' },
  SUPER_ADMIN: { label: 'مدير عام', variant: 'danger' },
}

const allRoles = ['BUYER', 'CREATOR', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']

const roleTasks: Record<string, string> = {
  BUYER: 'المشتري: تصفّح المنتجات وشراؤها وتحميل الملفات فقط.',
  CREATOR: 'المبدع: متجره الخاص، نشر المنتجات والكوبونات والإحصائيات حسب خطته.',
  MODERATOR: 'المشرف: مراجعة البلاغات والتقييمات والشكاوى والرد عليها. لا يملك صلاحيات أخرى.',
  ADMIN: 'المدير: إدارة المنصة اليومية (المنتجات، الطلبات، التصنيفات، المسحوبات، الكوبونات، الرسائل). لا يغيّر الأدوار ولا إعدادات المنصة.',
  SUPER_ADMIN: 'المدير العام: كل ما لدى المدير + إدارة المستخدمين والأدوار ومنح برو + إعدادات المنصة. الحساب محمي ولا يمكن تغيير دوره من اللوحة.',
}

interface CreatorProfile {
  plan?: string | null
  planExpiresAt?: string | null
}

interface AdminUser {
  id: string
  name?: string | null
  email: string
  role: string
  isBanned: boolean
  memberNo?: number | null
  createdAt: string
  creatorProfile?: CreatorProfile | null
}

async function apiJson(res: Response): Promise<Record<string, unknown>> {
  try { return await res.json() as Record<string, unknown> } catch { return {} }
}

async function getCurrentUserId(): Promise<string | null> {
  const res = await fetch('/api/me')
  const d = await res.json()
  const data = d?.data as { id?: string } | undefined
  return data?.id || null
}

async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch('/api/admin/users?pageSize=50')
  const d = await res.json()
  return (d.data as AdminUser[]) || []
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [meId, setMeId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getCurrentUserId()
      .then((id) => {
        if (cancelled) return
        setMeId(id)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getAdminUsers()
      .then((list) => {
        if (cancelled) return
        setUsers(list)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const updateRow = (id: string, patch: Partial<AdminUser>) => {
    setUsers((prev) => prev.map(u => u.id === id ? { ...u, ...patch } : u))
  }

  async function setRole(userId: string, role: string) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    const d = await apiJson(res)
    if (d.success) updateRow(userId, { role })
    else alert((d.error as string) || 'تعذّر تغيير الدور')
  }

  async function grantPro(userId: string) {
    const res = window.prompt('مدة منح برو بالأيام؟ اتركه فارغًا لمنح دائم (بدون انتهاء).', '30')
    if (res === null) return
    const raw = (res || '').trim()
    if (raw !== '' && (Number.isNaN(Number(raw)) || Number(raw) < 0)) {
      alert('أدخل عددًا صحيحًا من الأيام أو اتركه فارغًا')
      return
    }
    const days = raw === '' ? 0 : Math.round(Number(raw))
    const body: Record<string, unknown> = { plan: 'PRO' }
    if (days > 0) body.planDays = days
    const call = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await apiJson(call)
    if (d.success) {
      updateRow(userId, {
        creatorProfile: {
          ...(users.find(u => u.id === userId)?.creatorProfile || {}),
          plan: 'PRO',
          planExpiresAt: days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null,
        },
      })
    } else {
      alert((d.error as string) || 'تعذّر منح الخطة')
    }
  }

  async function revokePro(userId: string) {
    if (!window.confirm('إلغاء خطة برو لهذا المستخدم؟')) return
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'FREE' }),
    })
    const d = await apiJson(res)
    if (d.success) {
      updateRow(userId, {
        creatorProfile: {
          ...(users.find(u => u.id === userId)?.creatorProfile || {}),
          plan: 'FREE',
          planExpiresAt: null,
        },
      })
    } else {
      alert((d.error as string) || 'تعذّر إلغاء الخطة')
    }
  }

  async function toggleBan(userId: string, banned: boolean) {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBanned: !banned }),
    })
    updateRow(userId, { isBanned: !banned })
  }

  async function deleteUser(userId: string) {
    if (!window.confirm('متأكد من حذف هذا المستخدم نهائيًا؟ لا يمكن التراجع.')) return
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    const d = await apiJson(res)
    if (d.success) {
      setUsers((prev) => prev.filter(u => u.id !== userId))
    } else {
      alert((d.error as string) || 'فشل الحذف')
    }
  }

  async function setMemberNo(userId: string, current: number | null) {
    const raw = window.prompt('رقم العضو لهذا المستخدم (عدد صحيح موجب):', current != null ? String(current) : '')
    if (raw === null) return
    const n = Number(String(raw).trim())
    if (!Number.isInteger(n) || n <= 0) {
      alert('أدخل عددًا صحيحًا موجبًا')
      return
    }
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberNo: n }),
    })
    const d = await apiJson(res)
    if (d.success) updateRow(userId, { memberNo: n })
    else alert((d.error as string) || 'تعذّر تعيين رقم العضو')
  }

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="المستخدمين" subtitle={loading ? 'جاري التحميل...' : `${users.length} مستخدم — ترقية الأرتبة ومنح الخطة برو`} />

        <div className="max-w-md mb-6">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالاسم أو البريد..." />
        </div>

        <Card className="mb-6">
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-3">مهام الأدوار في المنصة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allRoles.map(r => (
                <div key={r} className="rounded-xl border border-gray-200/70 p-3 text-sm">
                  <Badge variant={roleMap[r]?.variant || 'default'}>{roleMap[r]?.label || r}</Badge>
                  <p className="mt-2 text-gray-600 leading-relaxed">{roleTasks[r]}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 font-medium w-16">الرقم</th>
                    <th className="px-4 py-3 font-medium">المستخدم</th>
                    <th className="px-4 py-3 font-medium">البريد</th>
                    <th className="px-4 py-3 font-medium">الدور</th>
                    <th className="px-4 py-3 font-medium">الخطة</th>
                    <th className="px-4 py-3 font-medium">التسجيل</th>
                    <th className="px-4 py-3 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const profile = user.creatorProfile || {}
                    const isPro = profile.plan === 'PRO'
                    const isSelf = meId != null && user.id === meId
                    return (
                      <tr key={user.id} className="border-b border-gray-50 last:border-0 align-top">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setMemberNo(user.id, user.memberNo ?? null)}
                            title="رقم العضو — اضغط للتغيير"
                            className="inline-flex items-center justify-center w-11 h-8 rounded-lg bg-blue-100 text-blue-700 text-sm font-bold font-mono leading-none transition-colors hover:bg-blue-700 hover:text-white"
                          >
                            #{user.memberNo ?? '—'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                              {user.name?.[0] || 'م'}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900">{user.name || '-'}</span>
                              {isSelf && (
                                <span className="ms-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">أنت</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={roleMap[user.role]?.variant || 'default'}>{roleMap[user.role]?.label || user.role}</Badge>
                            <select
                              value={user.role}
                              disabled={isSelf}
                              onChange={e => setRole(user.id, e.target.value)}
                              title={isSelf
                                ? 'أنت — حسابك محمي ولا يمكن تغيير دوره من اللوحة'
                                : (user.role === 'CREATOR' || user.role === 'BUYER')
                                  ? 'لا يمكن تحويل المشتري إلى مبدع أو العكس مباشرة'
                                  : 'ترقية الدور'}
                              className="mt-2 block w-28 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 px-2 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {allRoles.map(r => {
                                const blocked = (user.role === 'CREATOR' && r === 'BUYER') || (user.role === 'BUYER' && r === 'CREATOR')
                                return <option key={r} value={r} disabled={blocked}>{roleMap[r]?.label || r}</option>
                              })}
                            </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-start gap-1.5">
                            <Badge variant={isPro ? 'danger' : 'default'}>{isPro ? 'برو' : 'مجاني'}</Badge>
                            {isPro && profile.planExpiresAt && (
                              <span className="text-xs text-gray-500">
                                حتى {new Date(profile.planExpiresAt).toLocaleDateString('ar')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString('ar')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isPro ? (
                              <Button size="sm" variant="outline" onClick={() => revokePro(user.id)}>إلغاء برو</Button>
                            ) : (
                              <Button size="sm" variant="success" onClick={() => grantPro(user.id)}>منح برو</Button>
                            )}
                            <Button
                              size="sm"
                              variant={user.isBanned ? 'success' : 'danger'}
                              onClick={() => toggleBan(user.id, user.isBanned)}
                            >
                              {user.isBanned ? 'إلغاء الحظر' : 'حظر'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => deleteUser(user.id)}>حذف</Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        )}
      </main>
    </div>
  )
}
