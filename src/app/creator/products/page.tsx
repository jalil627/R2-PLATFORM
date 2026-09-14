'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import Button from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  DRAFT: { label: 'مسودة', variant: 'default' },
  PENDING_REVIEW: { label: 'قيد المراجعة', variant: 'warning' },
  APPROVED: { label: 'منشور', variant: 'success' },
  REJECTED: { label: 'مرفوض', variant: 'danger' },
  SUSPENDED: { label: 'معلق', variant: 'danger' },
}

interface CreatorListProduct {
  id: string
  title: string
  slug: string
  price: number
  status: string
  thumbnail?: string | null
  downloadCount?: number | null
  viewCount?: number | null
  _count?: { reviews?: number | null } | null
}

export default function CreatorProductsPage() {
  const [products, setProducts] = useState<CreatorListProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CreatorListProduct | null>(null)

  useEffect(() => {
    fetch('/api/creator/products')
      .then(r => r.json())
      .then(d => { setProducts(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/creator/products/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setProducts(prev => prev.filter(p => p.id !== id))
        setConfirmDelete(null)
      } else {
        alert(data.error || 'حدث خطأ أثناء الحذف')
      }
    } catch { alert('حدث خطأ أثناء الحذف') }
    finally { setDeletingId(null) }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Sidebar links={creatorLinks} title="لوحة التحكم" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="المنتجات" subtitle={`${products.length} منتج`} actions={
          <Link href="/creator/products/new"><Button>منتج جديد</Button></Link>
        } />

        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد منتجات</h3>
            <p className="text-gray-500 mb-4">ابدأ بإنشاء أول منتج</p>
            <Link href="/creator/products/new"><Button>إنشاء منتج</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                <div className="relative w-14 h-14 rounded-lg bg-blue-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {product.thumbnail ? (
                    <SmartImage src={product.thumbnail} alt={product.title} className="object-cover" sizes="56px" />
                  ) : (
                    <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
                    <Badge variant={statusMap[product.status]?.variant || 'default'}>{statusMap[product.status]?.label || product.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{product.price} دج</span>
                    <span>{product.downloadCount} تحميل</span>
                    <span>{product._count?.reviews || 0} تقييم</span>
                    <span>{product.viewCount} مشاهدة</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/product/${product.slug}`} className="p-2 rounded-lg hover:bg-gray-100" title="عرض">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </Link>
                  <Link href={`/creator/products/${product.id}/edit`} className="p-2 rounded-lg hover:bg-gray-100" title="تعديل">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </Link>
                  <button
                    onClick={() => setConfirmDelete(product)}
                    disabled={deletingId === product.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="حذف"
                  >
                    {deletingId === product.id ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !deletingId && setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">حذف المنتج</h3>
            <p className="text-sm text-gray-600 mb-6">
              هل أنت متأكد من حذف «{confirmDelete.title}»؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={!!deletingId}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={!!deletingId}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId ? 'جارٍ الحذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
