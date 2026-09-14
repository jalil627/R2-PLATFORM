'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import Select from '@/components/ui/select'
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

const typeOptions = [
  { value: 'EBOOK', label: 'كتاب إلكتروني' },
  { value: 'PDF', label: 'ملف PDF' },
  { value: 'ZIP', label: 'أرشيف ZIP' },
  { value: 'TEMPLATE', label: 'قالب' },
  { value: 'COURSE', label: 'دورة تعليمية' },
  { value: 'VIDEO', label: 'فيديو' },
  { value: 'AUDIO', label: 'صوتيات' },
  { value: 'SOFTWARE', label: 'برمجيات' },
  { value: 'RESOURCE', label: 'موارد' },
  { value: 'BUNDLE', label: 'حزمة' },
  { value: 'FREE', label: 'منتج مجاني' },
  { value: 'PAY_WHAT_YOU_WANT', label: 'ادفع ما تشاء' },
]

interface NewProductCategory {
  id: string
  name: string
  nameAr?: string | null
  slug: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<NewProductCategory[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ key: string; url: string; size: number; name: string }>>([])
  const [uploadedImages, setUploadedImages] = useState<Array<{ key: string; url: string; size: number; name: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.data || []))
  }, [])

  async function handleFileUpload(file: File) {
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/creator/products/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setUploadedFiles(prev => [...prev, data.data])
      } else {
        setError(data.error || 'فشل رفع الملف')
      }
    } catch {
      setError('فشل رفع الملف')
    } finally {
      setUploading(false)
    }
  }

  async function handleImageUpload(file: File) {
    setUploadingImages(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'product-images')
      const res = await fetch('/api/creator/products/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setUploadedImages(prev => [...prev, data.data])
      } else {
        setError(data.error || 'فشل رفع الصورة')
      }
    } catch {
      setError('فشل رفع الصورة')
    } finally {
      setUploadingImages(false)
    }
  }

  async function handleImagesSelect(files: FileList | null) {
    if (!files) return
    const remaining = 5 - uploadedImages.length
    const list = Array.from(files).slice(0, remaining)
    for (const file of list) {
      await handleImageUpload(file)
    }
  }

  async function submit(status: 'draft' | 'published') {
    setError('')
    setLoading(true)
    const form = document.getElementById('product-form') as HTMLFormElement
    const formData = new FormData(form)
    const payload = {
      title: formData.get('title'),
      description: formData.get('description'),
      shortDescription: formData.get('shortDescription'),
      type: formData.get('type'),
      price: parseFloat(formData.get('price') as string) || 0,
      compareAtPrice: formData.get('compareAtPrice') ? parseFloat(formData.get('compareAtPrice') as string) : null,
      license: formData.get('license'),
      categoryIds: formData.getAll('categories') as string[],
      isFree: (formData.get('type') as string) === 'FREE' || parseFloat(formData.get('price') as string) === 0,
      status,
      files: uploadedFiles.map(f => ({ name: f.name, url: f.url, size: f.size })),
      images: uploadedImages.map(f => ({ url: f.url, name: f.name })),
    }

    try {
      const res = await fetch('/api/creator/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        router.push('/creator/products')
      } else {
        setError(data.error || 'حدث خطأ ما')
      }
    } catch { setError('حدث خطأ ما') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={creatorLinks} title="لوحة التحكم" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="منتج جديد" subtitle="أدخل تفاصيل منتجك" />

        <form id="product-form" onSubmit={e => e.preventDefault()} className="max-w-2xl space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <h3 className="font-semibold text-gray-900">المعلومات الأساسية</h3>
              <Input name="title" label="عنوان المنتج" placeholder="مثال: كتاب أساسيات التصميم" required />
              <Textarea name="description" label="الوصف" rows={5} placeholder="اشرح بالتفصيل ماذا يحتوي المنتج..." />
              <Input name="shortDescription" label="وصف قصير" placeholder="وصف مختصر يظهر في بطاقة المنتج" />
              <Select name="type" label="نوع المنتج" options={typeOptions} placeholder="اختر النوع" required />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <h3 className="font-semibold text-gray-900">التسعير</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="price" type="number" label="السعر (دج)" placeholder="0" min={0} required />
                <Input name="compareAtPrice" type="number" label="السعر قبل الخصم (اختياري)" placeholder="0" min={0} />
              </div>
              <Input name="license" label="الترخيص" placeholder="مثال: استخدام شخصي فقط" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <h3 className="font-semibold text-gray-900">الملفات الرقمية</h3>
              <label className="block cursor-pointer">
                <input
                  type="file"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                    e.target.value = ''
                  }}
                />
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-600 transition-colors">
                  <p className="text-sm text-gray-600">{uploading ? 'جاري الرفع...' : 'اضغط لاختيار الملف الرقمي (PDF, ZIP, فيديو، إلخ)'}</p>
                </div>
              </label>
              {uploadedFiles.length > 0 && (
                <ul className="space-y-2">
                  {uploadedFiles.map((f, i) => (
                    <li key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm">
                      <span className="text-gray-700 truncate">{f.name}</span>
                      <button type="button" onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-blue-500 hover:text-blue-600 text-xs font-medium">إزالة</button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <h3 className="font-semibold text-gray-900">صور المنتج</h3>
              <p className="text-xs text-gray-500">أضف ما يصل إلى 5 صور (JPG, PNG, WEBP, GIF — حد أقصى 10MB للصورة). أول صورة تُستخدم كغلاف للمنتج.</p>
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    handleImagesSelect(e.target.files)
                    e.target.value = ''
                  }}
                />
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-600 transition-colors">
                  <p className="text-sm text-gray-600">{uploadingImages ? 'جاري رفع الصور...' : 'اضغط لاختيار صور المنتج'}</p>
                </div>
              </label>
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {uploadedImages.map((img, i) => (
                    <div key={img.key} className="relative group rounded-lg overflow-hidden border border-gray-200">
                      <div className="relative w-full h-20">
                        <SmartImage src={img.url} alt={img.name} className="object-cover" sizes="160px" />
                      </div>
                      {i === 0 && (
                        <span className="absolute top-1 left-1 text-[10px] bg-blue-700 text-white px-1.5 py-0.5 rounded-md font-medium">الغلاف</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/50 text-white text-xs font-medium flex items-center justify-center transition-opacity"
                      >
                        إزالة
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <h3 className="font-semibold text-gray-900">الفئة والتصنيف</h3>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">الفئات</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <label key={cat.id} className="cursor-pointer">
                      <input type="checkbox" name="categories" value={cat.id} className="sr-only peer" />
                      <span className="inline-flex px-3 py-1.5 rounded-full text-sm border border-gray-300 peer-checked:bg-blue-700 peer-checked:text-white peer-checked:border-blue-700 transition-colors">
                        {cat.nameAr || cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {error && <div className="p-3 rounded-lg bg-blue-50 border border-blue-200"><p className="text-sm text-blue-600">{error}</p></div>}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button type="button" onClick={() => submit('published')} loading={loading} className="w-full sm:w-auto">نشر (قيد المراجعة)</Button>
            <Button type="button" variant="outline" onClick={() => submit('draft')} disabled={loading} className="w-full sm:w-auto">حفظ كمسودة</Button>
            <Button type="button" variant="ghost" onClick={() => router.push('/creator/products')} className="w-full sm:w-auto">إلغاء</Button>
          </div>
        </form>
      </main>
    </div>
  )
}
