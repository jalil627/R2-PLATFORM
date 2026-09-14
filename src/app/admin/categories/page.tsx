'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import Select from '@/components/ui/select'

const iconOptions = [
  { value: 'book', label: 'كتاب', path: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' },
  { value: 'code', label: 'كود', path: 'M16 18l6-6-6-6M8 6l-6 6 6 6' },
  { value: 'palette', label: 'ألوان', path: 'M12 3a6 6 0 0 0 0 12H4a2 2 0 0 1-2-2V7a4 4 0 0 1 8 0v5a2 2 0 0 1-2 2h-2' },
  { value: 'video', label: 'فيديو', path: 'M23 7V3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2' },
  { value: 'music', label: 'صوت', path: 'M9 18V5l12-2v13' },
  { value: 'image', label: 'صورة', path: 'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z' },
  { value: 'archive', label: 'أرشيف', path: 'M21 8v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { value: 'layers', label: 'طبقات', path: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { value: 'cpu', label: 'برمجيات', path: 'M4 4h16M4 12h16M4 20h16M9 4v16M15 4v16' },
  { value: 'graduation-cap', label: 'دورة', path: 'M21 21a6 6 0 0 0-6-6H9a6 6 0 0 0-6 6m12-6V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v8' },
  { value: 'plus', label: 'إضافة', path: 'M12 5v14M5 12h14' },
  { value: 'edit', label: 'تعديل', path: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' },
  { value: 'trash2', label: 'حذف', path: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' },
]

const iconMap = Object.fromEntries(iconOptions.map(o => [o.value, o.path]))

function Icon({ icon, className = 'w-5 h-5' }: { icon?: string; className?: string }) {
  const path = icon ? iconMap[icon] : undefined
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {path && <path strokeLinecap="round" strokeLinejoin="round" d={path} />}
    </svg>
  )
}

interface CategoryParent {
  nameAr?: string | null
}

interface CategoryCount {
  products?: number
  children?: number
}

interface Category {
  id: string
  name: string
  nameAr: string
  slug: string
  icon?: string | null
  parentId?: string | null
  parent?: CategoryParent | null
  sortOrder?: number | null
  isActive: boolean
  _count?: CategoryCount | null
}

interface CategoryListResult {
  data: Category[]
  total: number
  totalPages: number
}

async function getCategories(page: number, search: string): Promise<CategoryListResult> {
  const params = new URLSearchParams({ page: page.toString(), pageSize: '20', q: search })
  const res = await fetch(`/api/admin/categories?${params}`)
  const data = await res.json()
  if (data.success) {
    return {
      data: data.data as Category[],
      total: data.total as number,
      totalPages: data.totalPages as number,
    }
  }
  return { data: [], total: 0, totalPages: 1 }
}

async function getParentCategories(): Promise<Category[]> {
  const res = await fetch('/api/admin/categories?pageSize=200&sort=name')
  const data = await res.json()
  if (data.success) {
    return (data.data as Category[]).filter((c) => c.isActive)
  }
  return []
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({
    name: '',
    nameAr: '',
    slug: '',
    icon: 'book',
    parentId: '',
    sortOrder: 0,
    isActive: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [parents, setParents] = useState<Category[]>([])

  async function refreshCategories() {
    setLoading(true)
    try {
      const r = await getCategories(page, search)
      setCategories(r.data)
      setTotal(r.total)
      setTotalPages(r.totalPages)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    getCategories(page, search)
      .then((r) => {
        if (cancelled) return
        setCategories(r.data)
        setTotal(r.total)
        setTotalPages(r.totalPages)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    getParentCategories()
      .then((list) => {
        if (cancelled) return
        setParents(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [page, search])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', nameAr: '', slug: '', icon: 'book', parentId: '', sortOrder: 0, isActive: true })
    setDialogOpen(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setForm({
      name: cat.name,
      nameAr: cat.nameAr,
      slug: cat.slug,
      icon: cat.icon || 'book',
      parentId: cat.parentId || '',
      sortOrder: cat.sortOrder || 0,
      isActive: cat.isActive,
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditing(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        closeDialog()
        refreshCategories()
      } else {
        alert(data.error || 'فشل العملية')
      }
    } catch (e) {
      console.error(e)
      alert('خطأ في الاتصال')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف هذا التصنيف؟ لا يمكن التراجع.')) return
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        refreshCategories()
      } else {
        alert(data.error || 'فشل الحذف')
      }
    } catch (e) {
      console.error(e)
      alert('خطأ في الاتصال')
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLoading(true)
    setSearch(e.target.value)
    setPage(1)
  }

  function handlePrevPage() {
    setLoading(true)
    setPage((p) => Math.max(1, p - 1))
  }

  function handleNextPage() {
    setLoading(true)
    setPage((p) => Math.min(totalPages, p + 1))
  }

  const iconSelectOptions = iconOptions.map(o => ({ value: o.value, label: o.label }))
  const parentOptions = [{ value: '', label: '— لا يوجد —' }, ...parents.map(p => ({ value: p.id, label: p.nameAr }))]

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <DashboardHeader title="إدارة التصنيفات" subtitle={`${total} تصنيف`} />
          <Button onClick={openCreate}><Icon icon="plus" className="w-4 h-4 ml-2" /> إضافة تصنيف</Button>
        </div>

        <Modal open={dialogOpen} onClose={closeDialog} title={editing ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'} size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="الاسم (عربي)" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} required />
              <Input label="الاسم (إنجليزي)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <Input label="الرمز (slug)" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required placeholder="مثال: ebooks" />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="أيقونة"
                value={form.icon}
                onChange={e => setForm({ ...form, icon: e.target.value })}
                options={iconSelectOptions}
              />
              <Select
                label="تصنيف أب (اختياري)"
                value={form.parentId}
                onChange={e => setForm({ ...form, parentId: e.target.value })}
                options={parentOptions}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input type="number" label="ترتيب العرض" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm">نشط</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={closeDialog}>إلغاء</Button>
              <Button type="submit" loading={submitting}>{editing ? 'حفظ التغييرات' : 'إضافة'}</Button>
            </div>
          </form>
        </Modal>

        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100">
              <Input
                placeholder="ابحث بالاسم أو الرمز..."
                value={search}
                onChange={handleSearchChange}
                className="max-w-xs"
              />
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <svg className="w-8 h-8 animate-spin mx-auto text-blue-700" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
                        <th className="px-4 py-3 font-medium">الاسم</th>
                        <th className="px-4 py-3 font-medium">الرمز</th>
                        <th className="px-4 py-3 font-medium">أيقونة</th>
                        <th className="px-4 py-3 font-medium">أب</th>
                        <th className="px-4 py-3 font-medium">ترتيب</th>
                        <th className="px-4 py-3 font-medium">منتجات</th>
                        <th className="px-4 py-3 font-medium">فرعيات</th>
                        <th className="px-4 py-3 font-medium">الحالة</th>
                        <th className="px-4 py-3 font-medium">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(cat => (
                        <tr key={cat.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900">{cat.nameAr}</span>
                            <br />
                            <span className="text-xs text-gray-500">{cat.name}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">{cat.slug}</td>
                          <td className="px-4 py-3"><Icon icon={cat.icon || undefined} className="w-5 h-5 text-blue-700" /></td>
                          <td className="px-4 py-3 text-sm text-gray-500">{cat.parent?.nameAr || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{cat.sortOrder}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{cat._count?.products || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{cat._count?.children || 0}</td>
                          <td className="px-4 py-3">
                            <Badge variant={cat.isActive ? 'success' : 'default'}>{cat.isActive ? 'نشط' : 'غير نشط'}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Icon icon="edit" className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" onClick={() => handleDelete(cat.id)}><Icon icon="trash2" className="w-4 h-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500">الصفحة {page} من {totalPages} — إجمالي {total}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page === 1}>السابق</Button>
                      <Button variant="outline" size="sm" onClick={handleNextPage} disabled={page === totalPages}>التالي</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
