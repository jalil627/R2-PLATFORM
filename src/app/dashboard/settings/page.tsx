'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

const buyerLinks = [
  { label: 'نظرة عامة', href: '/dashboard', icon: 'dashboard' },
  { label: 'مشترياتي', href: '/dashboard/purchases', icon: 'products' },
  { label: 'طلباتي', href: '/dashboard/orders', icon: 'orders' },
  { label: 'المفضلة', href: '/dashboard/wishlist', icon: 'earnings' },
  { label: 'الإعدادات', href: '/dashboard/settings', icon: 'settings' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const [delMsg, setDelMsg] = useState('')
  const [delLoading, setDelLoading] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => { if (d?.data) { setName(d.data.name || ''); setEmail(d.data.email || '') } })
      .catch(() => {})
  }, [])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavedMsg('')
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const d = await res.json()
    setSavedMsg(d?.success ? 'تم حفظ التغييرات بنجاح' : d?.error || 'حدث خطأ ما')
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdMsg('')
    const fd = new FormData(e.target as HTMLFormElement)
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: fd.get('current'), newPassword: fd.get('new') }),
    })
    const d = await res.json()
    setPwdMsg(d?.success ? 'تم تغيير كلمة المرور بنجاح' : d?.error || 'حدث خطأ ما')
    if (d?.success) (e.target as HTMLFormElement).reset()
  }

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setDelMsg('')
    setDelLoading(true)
    const fd = new FormData(e.target as HTMLFormElement)
    const res = await fetch('/api/me', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: fd.get('password') }),
    })
    const d = await res.json()
    if (d?.success) {
      await signOut({ redirect: false })
      router.push('/?deleted=true')
    } else {
      setDelMsg(d?.error || 'تعذر حذف الحساب')
      setDelLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={buyerLinks} title="حسابي" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="الإعدادات" />

        <div className="max-w-2xl space-y-6">
          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 mb-4">الملف الشخصي</h3>
              <form onSubmit={saveProfile} className="space-y-4">
                <Input label="الاسم" value={name} onChange={e => setName(e.target.value)} />
                <Input label="البريد الإلكتروني" type="email" value={email} disabled />
                <Input label="الهاتف" placeholder="05 XX XX XX XX" />
                <Input label="الموقع" placeholder="الجزائر" />
                {savedMsg && <p className={`text-sm ${savedMsg.startsWith('تم') ? 'text-emerald-600' : 'text-blue-600'}`}>{savedMsg}</p>}
                <Button type="submit">حفظ التغييرات</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 mb-4">تغيير كلمة المرور</h3>
              <form onSubmit={changePassword} className="space-y-4">
                <Input type="password" name="current" label="كلمة المرور الحالية" required />
                <Input type="password" name="new" label="كلمة المرور الجديدة" required minLength={6} />
                {pwdMsg && <p className={`text-sm ${pwdMsg.startsWith('تم') ? 'text-emerald-600' : 'text-blue-600'}`}>{pwdMsg}</p>}
                <Button type="submit" variant="outline">تغيير كلمة المرور</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 mb-2">التحول إلى مبدع</h3>
              <p className="text-sm text-gray-500 mb-4">افتح متجرك وابدأ بيع منتجاتك الرقمية بنفس الحساب</p>
              <Link href="/auth/become-creator">
                <Button>افتح متجرك الآن</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-semibold text-blue-600 mb-2">المنطقة الخطرة</h3>
              <p className="text-sm text-gray-500 mb-4">حذف حسابك سيزيل جميع بياناتك نهائيًا ولا يمكن التراجع</p>
              <form onSubmit={deleteAccount} className="space-y-4">
                <Input type="password" name="password" label="أدخل كلمة المرور لتأكيد الحذف" required />
                {delMsg && <p className="text-sm text-blue-600">{delMsg}</p>}
                <Button type="submit" variant="danger" loading={delLoading}>حذف الحساب نهائيًا</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}