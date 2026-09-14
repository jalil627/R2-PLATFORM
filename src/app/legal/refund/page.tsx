import { Overline } from '@/components/design/page-head'
import SiteHeader from '@/components/layout/site-header'
import Footer from '@/components/layout/footer'

const rules = [
  { title: 'المنتجات الرقمية', body: 'بما أن جميع منتجاتنا رقمية (ملفات قابلة للتحميل)، فإن سياسة الاسترجاع تختلف عن المنتجات المادية.' },
  { title: 'الاسترجاع المقبول', body: 'يتم قبول طلبات الاسترجاع في الحالات التالية: المنتج لا يطابق الوصف، ملف تالف أو لا يعمل، منتج مكرر تم شراؤه بالخطأ (ضمن 7 أيام).' },
  { title: 'عدم القبول', body: 'لا يتم قبول الإرجاع إذا: تم تحميل المنتج بالكامل، مر أكثر من 7 أيام على الشراء، المنتج يعمل كما هو موضح.' },
  { title: 'كيفية طلب الإرجاع', body: 'تواصل معنا من خلال صفحة الدعم مع رقم الطلب وسبب الإرجاع. سنراجع طلبك خلال 3 أيام عمل.' },
  { title: 'معالجة الإرجاع', body: 'في حال الموافقة، يتم إرجاع المبلغ إلى طريقة الدفع الأصلية خلال 5-10 أيام عمل.' },
]

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <span className="ghost-ink text-6xl sm:text-7xl font-extrabold leading-none tracking-tighter select-none block mb-4">L3</span>
        <Overline>R2 · LEGAL</Overline>
        <h1 className="display-tight text-3xl sm:text-4xl font-bold text-[var(--ink)] mt-3 mb-10">سياسة الاسترجاع</h1>
        <div className="space-y-6">
          {rules.map((s, i) => (
            <section key={s.title} className="bg-white rounded-2xl border border-gray-200 shadow-[var(--shadow-sm)] p-6">
              <h2 className="flex items-center gap-3 text-lg font-bold text-[var(--ink)] mb-3">
                <span className="ghost-ink text-xl font-extrabold select-none" aria-hidden="true">{i + 1}.</span>
                {s.title}
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{s.body}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}