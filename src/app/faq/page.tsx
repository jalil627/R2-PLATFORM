'use client'

import { useState } from 'react'
import { Overline } from '@/components/design/page-head'
import SessionHeader from '@/components/layout/session-header'

const faqs = [
  { q: 'كيف أفتح متجرًا؟', a: 'أنشئ حسابًا مجانيًا ثم انتقل إلى "متجري" في لوحة التحكم. املأ بيانات متجرك وابدأ بإضافة منتجاتك في دقائق.' },
  { q: 'كيف أبيع منتجاتي الرقمية؟', a: 'بعد فتح متجرك، أنشئ منتجك مع الوصف والملفات والتسعير. سيراجع فريقنا منتجك ويوافق عليه ليظهر في السوق.' },
  { q: 'ما هي العمولة المفروضة؟', a: 'نفرض نسبة عمولة بسيطة على كل عملية بيع. يمكنك الاطلاع على النسبة الحالية في صفحة الأسعار.' },
  { q: 'كيف أستلم أرباحي؟', a: 'تتراكم أرباحك في رصيدك المتاح، ويمكنك طلب السحب عبر تحويل بنكي أو CCP أو محفظة إلكترونية.' },
  { q: 'هل يمكنني بيع منتجات مجانية؟', a: 'نعم، يمكنك بيع منتجات مجانية لجذب الجمهور وبناء قاعدة عملاء.' },
  { q: 'كيف أحمي ملفاتي من السرقة؟', a: 'نستخدم روابط تحميل مشفرة وموقعة تنتهي صلاحيتها، ولا نكشف روابط ملفاتك العامة. يتحكم المشترون في الوصول عبر مكتبتهم.' },
  { q: 'ماذا يحدث بعد شراء العميل؟', a: 'يتم تأكيد الدفع آليًا، إضافة المنتج إلى مكتبة المشتري، وإشعارك بالبيع فورًا.' },
  { q: 'هل تدعمون الدفع بالدينار الجزائري؟', a: 'نعم، الدفع بالدينار الجزائري (دج) مدعوم حاليًا، مع قابلية إضافة عملات أخرى.' },
]

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <SessionHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <span className="ghost-ink text-6xl sm:text-7xl font-extrabold leading-none tracking-tighter select-none block mb-4">02</span>
        <Overline>R2 · FAQ</Overline>
        <h1 className="display-tight text-3xl sm:text-4xl font-bold text-[var(--ink)] mt-3 mb-2">الأسئلة الشائعة</h1>
        <p className="text-gray-500 mb-8">كل ما تحتاج معرفته عن المنصة</p>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-[var(--shadow-sm)] overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-4 text-right hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-3 font-medium text-[var(--ink)]">
                  <span className="ghost-ink text-lg font-extrabold select-none w-7 text-left" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  {faq.q}
                </span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${open === i ? 'rotate-180 text-[var(--primary-strong)]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && <p className="px-4 pb-4 pr-14 text-gray-600 text-sm leading-relaxed">{faq.a}</p>}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}