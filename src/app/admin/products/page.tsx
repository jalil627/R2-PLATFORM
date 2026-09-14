'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  DRAFT: { label: 'مسودة', variant: 'default' },
  PENDING_REVIEW: { label: 'قيد المراجعة', variant: 'warning' },
  APPROVED: { label: 'منشور', variant: 'success' },
  REJECTED: { label: 'مرفوض', variant: 'danger' },
  SUSPENDED: { label: 'معلق', variant: 'danger' },
}

interface ProductCreatorUser {
  name?: string | null
}

interface ProductCreator {
  user?: ProductCreatorUser | null
}

interface AdminProduct {
  id: string
  title: string
  type: string
  price: number
  isFree: boolean
  status: string
  creator?: ProductCreator | null
}

async function getAdminProducts(): Promise<AdminProduct[]> {
  const res = await fetch('/api/products?pageSize=50&status=all')
  const d = await res.json()
  return (d.data as AdminProduct[]) || []
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getAdminProducts()
      .then((list) => {
        if (cancelled) return
        setProducts(list)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function updateStatus(productId: string, status: string) {
    await fetch(`/api/admin/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setProducts((prev) => prev.map(p => p.id === productId ? { ...p, status } : p))
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <DashboardHeader title="المنتجات" subtitle={`${products.length} منتج`} />

        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
                      <th className="px-4 py-3 font-medium">المنتج</th>
                      <th className="px-4 py-3 font-medium">المبدع</th>
                      <th className="px-4 py-3 font-medium">السعر</th>
                      <th className="px-4 py-3 font-medium">الحالة</th>
                      <th className="px-4 py-3 font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.title}</p>
                              <p className="text-xs text-gray-500">{product.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.creator?.user?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.isFree ? 'مجاني' : formatCurrency(product.price)}</td>
                        <td className="px-4 py-3"><Badge variant={statusMap[product.status]?.variant || 'default'}>{statusMap[product.status]?.label || product.status}</Badge></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {product.status === 'PENDING_REVIEW' && (
                              <>
                                <button onClick={() => updateStatus(product.id, 'APPROVED')} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700">موافقة</button>
                                <button onClick={() => updateStatus(product.id, 'REJECTED')} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700">رفض</button>
                              </>
                            )}
                            {product.status === 'APPROVED' && (
                              <button onClick={() => updateStatus(product.id, 'SUSPENDED')} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700">تعليق</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
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
