'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import SmartImage from '@/components/ui/smart-image'

const creatorLinks = [
  { label: 'نظرة عامة', href: '/creator/dashboard', icon: 'dashboard' },
  { label: 'المنتجات', href: '/creator/products', icon: 'products' },
  { label: 'الطلبات', href: '/creator/orders', icon: 'orders' },
  { label: 'العملاء', href: '/creator/customers', icon: 'customers' },
  { label: 'الإحصائيات', href: '/creator/analytics', icon: 'analytics' },
  { label: 'الأرباح', href: '/creator/earnings', icon: 'earnings' },
  { label: 'الكوبونات', href: '/creator/coupons', icon: 'coupons' },
  { label: 'التسويق بالعمولة', href: '/creator/affiliates', icon: 'affiliate' },
  { label: 'المدفوعات', href: '/creator/payouts', icon: 'payouts' },
  { label: 'إعدادات المتجر', href: '/creator/settings', icon: 'settings' },
]

interface CreatorStore {
  name?: string | null
  slug?: string | null
  bio?: string | null
  logo?: string | null
  links?: Record<string, string> | null
}

export default function CreatorSettingsPage() {
  const router = useRouter()
  const [store, setStore] = useState<CreatorStore | null>(null)
  const [userName, setUserName] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [bio, setBio] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [switchMsg, setSwitchMsg] = useState('')
  const [switchLoading, setSwitchLoading] = useState(false)
  const [delMsg, setDelMsg] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState('')
  const [logoMsg, setLogoMsg] = useState('')
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [logoBusy, setLogoBusy] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    fetch('/api/creator/store')
      .then(r => r.json())
      .then(d => {
        if (d?.success) {
          setStore(d.data.store || null)
          setUserName(d.data.user?.name || '')
          setName(d.data.store?.name || '')
          setSlug(d.data.store?.slug || '')
          setBio(d.data.store?.bio || '')
          setLogoUrl(d.data.store?.logo || '')
          setAvatarUrl(d.data.user?.avatar || '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const saveStore = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    const cleanedSlug = slugifyStore(slug)
    const res = await fetch('/api/creator/store', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug: cleanedSlug, bio, links: store?.links || null }),
    })
    const d = await res.json()
    if (!res.ok || !d?.success) {
      setMsg({ text: d?.error || 'حدث خطأ ما', ok: false })
      return
    }
    setStore(d.data)
    setName(d.data.name || '')
    setSlug(d.data.slug || '')
    setMsg({ text: 'تم حفظ تغييرات المتجر بنجاح', ok: true })
  }

  const [slugCheck, setSlugCheck] = useState('')
  const [slugBusy, setSlugBusy] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const changeSlug = async (value: string) => {
    const cleaned = slugifyStore(value)
    setSlug(cleaned)
    setSlugCheck('')
    if (!cleaned || cleaned === store?.slug) return
    setSlugBusy(true)
    try {
      const res = await fetch(`/api/creator/store/check?slug=${encodeURIComponent(cleaned)}`)
      const d = await res.json()
      setSlugCheck(d?.available ? 'available' : 'taken')
    } catch {
      setSlugCheck('')
    } finally {
      setSlugBusy(false)
    }
  }

  function slugifyStore(s: string) {
    return s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0640-\u06FF]+/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
  }

  const switchToBuyer = async () => {
    setSwitchMsg('')
    setSwitchLoading(true)
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'BUYER' }),
    })
    const d = await res.json()
    if (d?.success) {
      await signOut({ redirect: false })
      router.push('/auth/login?switched=true')
    } else {
      setSwitchMsg(d?.error || 'حدث خطأ ما')
      setSwitchLoading(false)
    }
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

  const uploadImage = async (file: File, folder: 'store-logos' | 'avatars') => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', folder)
    const res = await fetch('/api/creator/products/upload', { method: 'POST', body: fd })
    const d = await res.json()
    if (!d?.success) throw new Error(d?.error || 'فشل رفع الصورة')
    return d.data.url as string
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarBusy(true)
    setAvatarMsg('')
    try {
      const url = await uploadImage(file, 'avatars')
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: url }),
      })
      const d = await res.json()
      if (!d?.success) throw new Error(d?.error || 'فشل حفظ الصورة')
      setAvatarUrl(url)
      setAvatarMsg('تم تحديث صورة الملف الشخصي ✓')
    } catch (err: unknown) {
      setAvatarMsg(err instanceof Error ? err.message : 'حدث خطأ ما')
    } finally {
      setAvatarBusy(false)
    }
  }

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoBusy(true)
    setLogoMsg('')
    try {
      const url = await uploadImage(file, 'store-logos')
      const res = await fetch('/api/creator/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, bio, links: store?.links || null, logo: url }),
      })
      const d = await res.json()
      if (!res.ok || !d?.success) throw new Error(d?.error || 'فشل حفظ الشعار')
      setLogoUrl(url)
      setLogoMsg('تم تحديث شعار المتجر ✓')
    } catch (err: unknown) {
      setLogoMsg(err instanceof Error ? err.message : 'حدث خطأ ما')
    } finally {
      setLogoBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={creatorLinks} title="لوحة التحكم" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="إعدادات المتجر" />

        <div className="max-w-2xl space-y-6">
          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 mb-4">الصور</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">صورة الملف الشخصي</p>
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center flex-shrink-0 border-2 border-blue-200">
                      {avatarUrl ? (
                        <SmartImage src={avatarUrl} alt="الصورة الشخصية" className="object-cover" sizes="64px" />
                      ) : (
                        <span className="text-2xl font-bold text-blue-700">{userName?.[0] || 'م'}</span>
                      )}
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      {avatarBusy ? (
                        <span className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={avatarBusy} />
                      تغيير الصورة
                    </label>
                  </div>
                  {avatarMsg && <p className="mt-2 text-sm text-emerald-600">{avatarMsg}</p>}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">شعار المتجر</p>
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl bg-blue-100 overflow-hidden flex items-center justify-center flex-shrink-0 border-2 border-blue-200">
                      {logoUrl ? (
                        <SmartImage src={logoUrl} alt="شعار المتجر" className="object-cover" sizes="64px" />
                      ) : (
                        <span className="text-2xl font-bold text-blue-700">{name?.[0] || 'م'}</span>
                      )}
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      {logoBusy ? (
                        <span className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogo} disabled={logoBusy} />
                      تغيير الشعار
                    </label>
                  </div>
                  {logoMsg && <p className="mt-2 text-sm text-emerald-600">{logoMsg}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 mb-4">هوية المتجر</h3>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}</div>
              ) : (
                <form onSubmit={saveStore} className="space-y-4">
                  <Input label="اسم المتجر" value={name} onChange={e => setName(e.target.value)} required />
                  <div>
                    <Input
                      label="رابط المتجر"
                      value={slug}
                      onChange={e => changeSlug(e.target.value)}
                      hint={`${origin}/store/`}
                      dir="ltr"
                      placeholder="اختر رابط متجرك بنفسك"
                    />
                    {slug && (
                      <p className="mt-1 text-sm" dir="ltr">
                        <span className="text-gray-500">{origin}/store/</span>
                        <span className="font-mono text-blue-700">{slug}</span>
                        <span className="text-gray-400">/</span>
                      </p>
                    )}
                    {slugBusy && <p className="mt-1 text-xs text-gray-500">جاري التحقق...</p>}
                    {slugCheck === 'available' && <p className="mt-1 text-xs text-emerald-600">الرابط متاح ✓</p>}
                    {slugCheck === 'taken' && <p className="mt-1 text-xs text-blue-600">هذا الرابط مستخدم، اختر اسمًا آخر</p>}
                  </div>
                  <Textarea label="نبذة عن المتجر" value={bio} onChange={e => setBio(e.target.value)} rows={3} />
                  <Input label="الموقع الإلكتروني" placeholder="https://..." />
                  {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-600' : 'text-blue-600'}`}>{msg.text}</p>}
                  <Button type="submit">حفظ التغييرات</Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 mb-2">المعلومات الشخصية</h3>
              <p className="text-sm text-gray-500 mb-4">معلومات الهوية للتحقق والدفعات</p>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="الاسم الكامل" defaultValue={userName} disabled />
                  <Input label="رقم الهاتف" placeholder="05 XX XX XX XX" />
                </div>
                <Input label="رقم CCP / الحساب" placeholder="أدخل رقم الحساب للدفعات" />
                <p className="text-sm text-amber-600">سيُطلب رقم الحساب عند تفعيل خدمة السحب.</p>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 mb-2">التحول إلى مشتري</h3>
              <p className="text-sm text-gray-500 mb-4">ستغلق لوحة المتجر ويبقى متجرك ومنتجاتك محفوظة. يمكنك العودة إلى مبدع في أي وقت.</p>
              {switchMsg && <p className="text-sm text-blue-600 mb-2">{switchMsg}</p>}
              <Button type="button" variant="outline" loading={switchLoading} onClick={switchToBuyer}>التحول إلى مشتري</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-semibold text-blue-600 mb-2">المنطقة الخطرة</h3>
              <p className="text-sm text-gray-500 mb-4">حذف حسابك سيزيل متجرك ومنتجاتك وبياناتك نهائيًا ولا يمكن التراجع</p>
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