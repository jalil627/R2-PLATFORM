'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import Select from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import SmartImage from '@/components/ui/smart-image'
import { Badge } from '@/components/ui/badge'

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

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  DRAFT: { label: 'مسودة', variant: 'default' },
  PENDING_REVIEW: { label: 'قيد المراجعة', variant: 'warning' },
  APPROVED: { label: 'منشور', variant: 'success' },
  REJECTED: { label: 'مرفوض', variant: 'danger' },
  SUSPENDED: { label: 'معلق', variant: 'danger' },
}

interface EditProductCategory {
  id: string
  name: string
  nameAr?: string | null
  slug: string
}

interface EditProductFile {
  id: string
  url: string
  size?: number | null
  name: string
  mimeType?: string | null
}

interface EditProductImage {
  id: string
  url: string
  alt?: string | null
}

interface LoadedProduct {
  status?: string | null
  title?: string | null
  description?: string | null
  shortDescription?: string | null
  type?: string | null
  price?: number | null
  compareAtPrice?: number | null
  license?: string | null
  categoryIds?: string[] | null
  files?: EditProductFile[] | null
  images?: EditProductImage[] | null
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [categories, setCategories] = useState<EditProductCategory[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState<LoadedProduct | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    type: '',
    price: '0',
    compareAtPrice: '',
    license: '',
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ key: string; url: string; size: number; name: string; mimeType?: string }>>([])
  const [uploadedImages, setUploadedImages] = useState<Array<{ key: string; url: string; size: number; name: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.data || []))
  }, [])

  useEffect(() => {
    if (!id) return
    fetch(`/api/creator/products/${id}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success || !d.data) {
          setError(d.error || 'تعذر تحميل المنتج')
          setLoading(false)
          return
        }
        const p = d.data
        setLoaded(p)
        setForm({
          title: p.title || '',
          description: p.description || '',
          shortDescription: p.shortDescription || '',
          type: p.type || '',
          price: String(p.price ?? 0),
          compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
          license: p.license || '',
        })
        setSelectedCategories(p.categoryIds || [])
        setUploadedFiles((p.files || []).map((f: EditProductFile) => ({ key: f.id, url: f.url, size: f.size || 0, name: f.name, mimeType: f.mimeType || undefined })))
        setUploadedImages((p.images || []).map((img: EditProductImage, i: number) => ({ key: img.id, url: img.url, size: 0, name: img.alt || `صورة ${i + 1}` })))
        setLoading(false)
      })
      .catch(() => { setError('تعذر تحميل المنتج'); setLoading(false) })
  }, [id])

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
    setSaving(true)
    const price = parseFloat(form.price) || 0
    const compareAt = form.compareAtPrice ? parseFloat(form.compareAtPrice) : null
    const payload = {
      title: form.title,
      description: form.description,
      shortDescription: form.shortDescription,
      type: form.type,
      price,
      compareAtPrice: compareAt,
      license: form.license,
      categoryIds: selectedCategories,
      isFree: form.type === 'FREE' || price === 0,
      status,
      files: uploadedFiles.map(f => ({ name: f.name, url: f.url, size: f.size, mimeType: f.mimeType })),
      images: uploadedImages.map(f => ({ url: f.url, name: f.name })),
    }

    try {
      const res = await fetch(`/api/creator/products/${id}`, {
        method: 'PATCH',
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
    finally { setSaving(false) }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={creatorLinks} title="لوحة التحكم" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="تعديل المنتج" subtitle={loading ? 'جاري تحميل المنتج...' : form.title} />

        {loading ? (
          <div className="space-y-3 max-w-2xl">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : error && !loaded ? (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200"><p className="text-sm text-blue-600">{error}</p></div>
        ) : loaded ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              <Badge variant={statusMap[loaded.status || '']?.variant || 'default'}>{statusMap[loaded.status || '']?.label || loaded.status}</Badge>
              {(loaded.status === 'APPROVED' || loaded.status === 'PENDING_REVIEW') && (
                <p className="text-xs text-gray-500">يمكنك تعديل منتجك في أي وقت — التعديلات تُحفظ مباشرة على المنتج المنشور.</p>
              )}
              {loaded.status === 'DRAFT' && (
                <p className="text-xs text-gray-500">بعد النشر سيُرسل المنتج للمراجعة قبل الظهور للجمهور.</p>
              )}
              {loaded.status === 'REJECTED' && (
                <p className="text-xs text-gray-500">صحّح ملاحظات المراجعة ثم أعد إرسال المنتج للنشر بالزر أدناه.</p>
              )}
            </div>

            <form id="edit-product-form" onSubmit={e => e.preventDefault()} className="max-w-2xl space-y-6">
              <Card>
                <CardContent className="space-y-4">
                  <h3 className="font-semibold text-gray-900">المعلومات الأساسية</h3>
                  <Input name="title" label="عنوان المنتج" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثال: كتاب أساسيات التصميم" required />
                  <Textarea name="description" label="الوصف" rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="اشرح بالتفصيل ماذا يحتوي المنتج..." />
                  <Input name="shortDescription" label="وصف قصير" value={form.shortDescription} onChange={e => setForm({ ...form, shortDescription: e.target.value })} placeholder="وصف مختصر يظهر في بطاقة المنتج" />
                  <Select name="type" label="نوع المنتج" value={form.type} options={typeOptions} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="اختر النوع" required />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4">
                  <h3 className="font-semibold text-gray-900">التسعير</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input name="price" type="number" label="السعر (دج)" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} min={0} required />
                    <Input name="compareAtPrice" type="number" label="السعر قبل الخصم (اختياري)" value={form.compareAtPrice} onChange={e => setForm({ ...form, compareAtPrice: e.target.value })} min={0} />
                  </div>
                  <Input name="license" label="الترخيص" value={form.license} onChange={e => setForm({ ...form, license: e.target.value })} placeholder="مثال: استخدام شخصي فقط" />
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
                      <p className="text-sm text-gray-600">{uploading ? 'جاري الرفع...' : 'اضغط لاختيار ملف رقمي جديد (سيستبدل الملفات الحالية)'}</p>
                    </div>
                  </label>
                  {uploadedFiles.length > 0 && (
                    <ul className="space-y-2">
                      {uploadedFiles.map((f, i) => (
                        <li key={f.key || i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm">
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
                      <p className="text-sm text-gray-600">{uploadingImages ? 'جاري رفع الصور...' : 'اضغط لإضافة أو استبدال صور المنتج'}</p>
                    </div>
                  </label>
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {uploadedImages.map((img, i) => (
                        <div key={img.key || i} className="relative group rounded-lg overflow-hidden border border-gray-200">
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
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat.id)}
                            onChange={() => setSelectedCategories(prev =>
                              prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id]
                            )}
                            className="sr-only peer"
                          />
                          <span className={`inline-flex px-3 py-1.5 rounded-full text-sm border transition-colors peer-checked:bg-blue-700 peer-checked:text-white peer-checked:border-blue-700 border-gray-300 ${selectedCategories.includes(cat.id) ? 'bg-blue-700 text-white border-blue-700' : ''}`}>
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
                <Button type="button" onClick={() => submit('published')} loading={saving} className="w-full sm:w-auto">
                  {loaded.status === 'APPROVED' ? 'حفظ' : loaded.status === 'PENDING_REVIEW' ? 'حفظ' : 'حفظ ونشر'}
                </Button>
                <Button type="button" variant="outline" onClick={() => submit('draft')} disabled={saving} className="w-full sm:w-auto">حفظ كمسودة</Button>
                <Button type="button" variant="ghost" onClick={() => router.push('/creator/products')} className="w-full sm:w-auto">إلغاء</Button>
              </div>
            </form>
          </>
        ) : null}
      </main>
    </div>
  )
}