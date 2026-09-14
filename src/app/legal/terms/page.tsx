import { Overline } from '@/components/design/page-head'
import SiteHeader from '@/components/layout/site-header'

const sections = [
  { title: 'القبول بالشروط', body: 'باستخدام منصة R2 - PLATFORM، أنت توافق على هذه الشروط والأحكام. إذا لم توافق، يرجى عدم استخدام المنصة.' },
  { title: 'الحسابات', body: 'أنت مسؤول عن الحفاظ على سرية حسابك وجميع الأنشطة التي تحدث تحت حسابك. يجب أن يكون عمرك 18 عامًا على الأقل لاستخدام المنصة.' },
  { title: 'المنتجات الرقمية', body: 'جميع المنتجات الرقمية المباعة عبر المنصة هي ملك للمبدعين. المنصة تعمل كوسيط بين البائع والمشتري. يجب أن تتوافق جميع المنتجات مع قوانين الجزائر والقوانين المعمول بها.' },
  { title: 'المدفوعات', body: 'تتم جميع المدفوعات بأمان عبر مزودي الدفع المعتمدين. لا تخزن المنصة أي بيانات بطاقات ائتمان. يتم تحويل أرباح المبدعين حسب سياسة السحب المتاحة.' },
  { title: 'المستحقات والرسوم', body: 'تخصم المنصة نسبة عمولة من كل عملية بيع. تختلف النسبة حسب الخطة والاتفاق. جميع المبالغ معروضة بالدينار الجزائري (دج).' },
  { title: 'الإرجاع', body: 'بما أن المنتجات رقمية، فإن سياسة الإرجاع تخضع لتقدير المنصة والمبدع. يرجى مراجعة سياسة الاسترجاع التفصيلية.' },
  { title: 'الملكية الفكرية', body: 'المبدعون يحتفظون بجميع حقوق الملكية الفكرية لمنتجاتهم. المشترون يحصلون على ترخيص للاستخدام الشخصي فقط ما لم يُذكر خلاف ذلك.' },
  { title: 'التعديلات', body: 'تحتفظ المنصة بالحق في تعديل هذه الشروط في أي وقت. سيتم إعلان أي تغييرات جوهرية مسبقًا.' },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <span className="ghost-ink text-6xl sm:text-7xl font-extrabold leading-none tracking-tighter select-none block mb-4">L1</span>
        <Overline>R2 · LEGAL</Overline>
        <h1 className="display-tight text-3xl sm:text-4xl font-bold text-[var(--ink)] mt-3 mb-10">الشروط والأحكام</h1>
        <div className="space-y-6">
          {sections.map((s, i) => (
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
    </div>
  )
}