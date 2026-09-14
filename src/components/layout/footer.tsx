import Link from 'next/link'

const linkClass =
  'inline-block text-sm text-gray-500 hover:text-[var(--primary-strong)] transition-colors'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl brand-gradient flex items-center justify-center shadow-md shadow-[var(--a-600)]/30">
                <span className="text-white font-bold text-sm">R2</span>
              </div>
              <span className="text-xl font-bold tracking-tight">
                R2 - <span className="brand-text">PLATFORM</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              منصة جزائرية لبيع وشراء المنتجات الرقمية بالدينار الجزائري. ابدأ متجرك اليوم.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[var(--ink)] mb-4">روابط سريعة</h3>
            <ul className="space-y-2.5">
              <li><Link href="/marketplace" className={linkClass}>السوق</Link></li>
              <li><Link href="/features" className={linkClass}>المميزات</Link></li>
              <li><Link href="/pricing" className={linkClass}>الأسعار</Link></li>
              <li><Link href="/auth/register" className={linkClass}>افتح متجرك</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[var(--ink)] mb-4">قانوني</h3>
            <ul className="space-y-2.5">
              <li><Link href="/legal/terms" className={linkClass}>الشروط والأحكام</Link></li>
              <li><Link href="/legal/privacy" className={linkClass}>سياسة الخصوصية</Link></li>
              <li><Link href="/legal/refund" className={linkClass}>سياسة الاسترجاع</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[var(--ink)] mb-4">تواصل معنا</h3>
            <ul className="space-y-2.5">
              <li><Link href="/contact" className={linkClass}>تواصل معنا</Link></li>
              <li><Link href="/complaints" className={linkClass}>خانة الشكاوى</Link></li>
              <li><Link href="/help" className={linkClass}>المساعدة</Link></li>
              <li><Link href="/faq" className={linkClass}>الأسئلة الشائعة</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} R2 - PLATFORM. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-400 px-2 py-1 rounded-md bg-gray-100">AR</span>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <span className="sr-only">English</span>
              <span className="text-sm font-medium">EN</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
