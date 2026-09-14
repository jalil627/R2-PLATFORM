import Link from 'next/link'
import SiteHeader from '@/components/layout/site-header'
import PageHero, { SectionHead } from '@/components/design/page-head'
import Footer from '@/components/layout/footer'

const features = [
  { title: 'متجر مخصص', desc: 'افتح متجرًا رقميًا بهوية فريدة وعلامتك التجارية الخاصة', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { title: 'إدارة المنتجات', desc: 'ارفع منتجاتك مع وصف، صور، ملفات، تسعير وخصومات', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { title: 'دفع آمن', desc: 'نظام دفع موثوق مع حماية للمشترين والبائعين', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { title: 'توصيل فوري', desc: 'تسليم المنتجات الرقمية فورًا بعد الشراء', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { title: 'كوبونات خصم', desc: 'أنشئ كوبونات بخصومات نسبية أو ثابتة', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { title: 'تقييمات ومراجعات', desc: 'تلقى تقييمات من المشترين المؤكدين', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { title: 'إحصائيات متقدمة', desc: 'تتبع مبيعاتك وإيراداتك وعملائك', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { title: 'تسويق بالعمولة', desc: 'دع الآخرين يروجون لمنتجتك مقابل عمولة', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
]

export default async function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <PageHero
          index="06"
          overline="R2 · TAB"
          title="كل ما تحتاجه لبيع منتجاتك الرقمية"
          description="أدوات قوية وسهلة الاستخدام لإدارة متجرك ونمو أعمالك."
        />
        <div className="pt-14">
          <SectionHead index="01" overline="R2 · TAB" title="مزايا المنصة" description="ثمانية ركائز تجعل البيع عبر R2 تجربة سريعة وموثوقة." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={f.title} className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-[var(--a-500)]/50 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--primary-strong)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
                  </svg>
                </div>
                <span aria-hidden="true" className="ghost-ink text-2xl font-extrabold leading-none tracking-tighter select-none">0{i + 1}</span>
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)] mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <section className="relative overflow-hidden bg-gradient-to-b from-[var(--section-tint)] to-white border-t border-gray-200/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(60rem 30rem at 90% -10%, rgba(59,109,246,0.12) 0%, transparent 55%), radial-gradient(45rem 25rem at 0% 110%, rgba(37,78,219,0.10) 0%, transparent 55%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="overline-label inline-flex items-center gap-2 justify-center text-[11px] font-semibold tracking-widest text-[var(--primary-strong)] mb-4">
            <span className="h-px w-6 bg-[var(--a-500)]" />
            R2 · BEGIN
            <span className="h-px w-6 bg-[var(--a-500)]" />
          </p>
          <h2 className="display-tight text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--ink)] mb-3">جاهز للبدء؟</h2>
          <p className="text-gray-500 mb-8">افتح متجرك مجانًا وابدأ البيع اليوم</p>
          <Link href="/auth/register" className="inline-flex px-8 py-3 rounded-xl brand-gradient text-white font-bold text-lg hover:brightness-110 transition-all">
            ابدأ مجانًا
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}