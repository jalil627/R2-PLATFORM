import Sidebar from '@/components/layout/sidebar'

const adminLinks = [
  { label: 'نظرة عامة', href: '/admin', icon: 'dashboard', section: 'overview' },
  { label: 'المستخدمون', href: '/admin/users', icon: 'users', section: 'users' },
  { label: 'المبدعون', href: '/admin/creators', icon: 'analytics', section: 'creators' },
  { label: 'المنتجات', href: '/admin/products', icon: 'products', section: 'products' },
  { label: 'التصنيفات', href: '/admin/categories', icon: 'categories', section: 'categories' },
  { label: 'الطلبات', href: '/admin/orders', icon: 'orders', section: 'orders' },
  { label: 'الخزينة', href: '/admin/treasury', icon: 'treasury', section: 'treasury' },
  { label: 'المسحوبات', href: '/admin/payouts', icon: 'payouts', section: 'payouts' },
  { label: 'الكوبونات', href: '/admin/coupons', icon: 'coupons', section: 'coupons' },
  { label: 'التقييمات', href: '/admin/reviews', icon: 'reviews', section: 'reviews' },
  { label: 'البلاغات', href: '/admin/reports', icon: 'reports', section: 'reports' },
  { label: 'الشكاوى', href: '/admin/complaints', icon: 'complaints', section: 'complaints' },
  { label: 'الاشتراكات', href: '/admin/subscriptions', icon: 'subscriptions', section: 'subscriptions' },
  { label: 'الرسائل', href: '/admin/messages', icon: 'broadcast', section: 'messages' },
  { label: 'برنامج العمولة', href: '/admin/affiliates', icon: 'affiliate', section: 'affiliates' },
  { label: 'سجل المراجعة', href: '/admin/audit-logs', icon: 'audit', section: 'audit' },
  { label: 'تنبيهات النظام', href: '/admin/alerts', icon: 'alert', section: 'alerts' },
  { label: 'إعدادات المنصة', href: '/admin/settings', icon: 'settings', section: 'settings' },
]

export default function AdminSidebar() {
  return <Sidebar links={adminLinks} title="الإدارة" />
}
