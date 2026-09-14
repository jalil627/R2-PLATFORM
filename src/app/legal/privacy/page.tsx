import Link from 'next/link'
import { Overline } from '@/components/design/page-head'
import SiteHeader from '@/components/layout/site-header'

const sections = [
  { title: 'جمع المعلومات', body: 'نجمع المعلومات التي تقدمها مباشرة عند التسجيل (الاسم، البريد الإلكتروني، كلمة المرور المشفرة) ومعلومات الاستخدام والإحصائيات لتحسين الخدمة.' },
  { title: 'استخدام المعلومات', body: 'نستخدم معلوماتك لتوفير وتحسين خدماتنا، معالجة المدفوعات، التواصل معك، وإرسال إشعارات تتعلق بحسابك وطلباتك.' },
  { title: 'مشاركة المعلومات', body: 'لا نبيع معلوماتك الشخصية. قد نشارك معلوماتك مع مزودي الدفع والخدمات الضرورية لتشغيل المنصة فقط.' },
  { title: 'الأمان', body: 'نستخدم إجراءات أمنية معقولة لحماية معلوماتك، بما في ذلك التشفير والتحكم في الوصول والـ firewall. لا يمكننا ضمان الأمان المطلق.' },
  { title: 'الكوكيز', body: 'نستخدم الكوكيز والتقنيات المماثلة لتحسين تجربتك وتحليل استخدام المنصة.' },
  { title: 'حقوقك', body: 'لك حق الوصول إلى معلوماتك وتصحيحها وحذفها. يمكنك إدارة تفضيلاتك من إعدادات الحساب.' },
  { title: 'التواصل', body: 'لأي استفسارات حول سياسة الخصوصية، تواصل معنا عبر صفحة تواصل معنا.' },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <span className="ghost-ink text-6xl sm:text-7xl font-extrabold leading-none tracking-tighter select-none block mb-4">L2</span>
        <Overline>R2 · LEGAL</Overline>
        <h1 className="display-tight text-3xl sm:text-4xl font-bold text-[var(--ink)] mt-3 mb-10">سياسة الخصوصية</h1>
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
          <p className="text-sm text-gray-500">
            لصفحة تواصل معنا، زر{' '}
            <Link href="/contact" className="text-[var(--primary-strong)] hover:underline">تواصل معنا</Link>.
          </p>
        </div>
      </main>
    </div>
  )
}