import Link from 'next/link'
import { auth } from '@/lib/auth/config'
import Header from '@/components/layout/header'
import PageHero, { Overline } from '@/components/design/page-head'
import { getPlatformSettings, getPromoPlanPrices } from '@/lib/plans'

export default async function PricingPage() {
  const session = await auth()
  const user = session?.user as { name?: string; email?: string; role?: string; avatar?: string | null } | undefined

  const settings = await getPlatformSettings()
  const promo = getPromoPlanPrices(settings, false)

  const firstPrice = promo.first.price
  const firstOriginal = promo.first.original
  const firstDiscount = promo.first.discount
  const renewPrice = promo.renew.price
  const renewOriginal = promo.renew.original
  const renewDiscount = promo.renew.discount

  const plans = [
    {
      name: 'مجاني',
      nameEn: 'Free',
      price: '0',
      currency: 'دج',
      description: 'لبدء رحلتك في بيع المنتجات الرقمية',
      features: ['عدد محدود من المنتجات', 'سوق مشترك', 'شراء منتجات الآخرين', 'دعم عبر البريد'],
      ctaGuest: 'ابدأ مجانًا',
      ctaAuthed: 'لوحة التحكم',
      hrefAuthed: '/dashboard',
      highlighted: false,
    },
    {
      name: 'برو',
      nameEn: 'Pro',
      price: String(firstPrice),
      currency: 'دج / أول شهر',
      original: firstOriginal > firstPrice ? String(firstOriginal) : null,
      discount: firstDiscount,
      description: 'كامل المميزات للشهر الأول بسعر البداية',
      features: ['منتجات غير محدودة', 'كوبونات خصم', 'إحصائيات متقدمة', 'تسويق بالعمولة وروابط دعوة', 'تمييز منتجاتك', 'دعم أولوية'],
      ctaGuest: 'اشترك في برو',
      ctaAuthed: 'الخطة والاشتراك',
      hrefAuthed: '/creator/plans',
      highlighted: true,
      badge: firstDiscount > 0 ? `عرض ${firstDiscount}%` : 'الأفضل للبدء',
    },
    {
      name: 'برو — التجديد',
      nameEn: 'Pro Renewal',
      price: String(renewPrice),
      currency: 'دج / شهر بعد الأول',
      original: renewOriginal > renewPrice ? String(renewOriginal) : null,
      discount: renewDiscount,
      description: 'استمرار كامل المميزات من الشهر الثاني',
      features: ['كل مميزات برو', 'أسعار شفافة بدون التزام سنوي', 'ترقية بأي وقت', 'دعم أولوية 24/7'],
      ctaGuest: 'اشترك في برو',
      ctaAuthed: 'تجديد الخطة',
      hrefAuthed: '/creator/plans',
      highlighted: false,
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <Header
        user={user
          ? { name: user.name || '', email: user.email || '', role: user.role || 'BUYER', avatar: user.avatar ?? null }
          : null}
      />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <PageHero
          index="07"
          overline="R2 · BILLING"
          title="أسعار بسيطة وواضحة"
          description="اختر الخطة المناسبة لك. لا رسوم خفية."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-10">
          {plans.map((plan) => {
            const href = user ? plan.hrefAuthed : '/auth/register'
            const cta = user ? plan.ctaAuthed : plan.ctaGuest
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  plan.highlighted
                    ? 'brand-gradient text-white ring-4 ring-[var(--a-500)]/40 scale-[1.02] shadow-[0_20px_50px_-20px_rgba(37,78,219,0.6)]'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full bg-white text-[var(--primary-strong)] shadow-sm">
                    {plan.badge}
                  </span>
                )}
                <p className={`overline-label text-[10px] font-semibold tracking-widest mb-1 ${plan.highlighted ? 'text-blue-100' : 'text-[var(--primary-strong)]'}`}>
                  {plan.nameEn}
                </p>
                <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? '' : 'text-[var(--ink)]'}`}>{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>{plan.description}</p>
                <div className="mb-6">
                  {plan.discount && plan.discount > 0 ? (
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold mb-2 ${plan.highlighted ? 'bg-white/20 text-white' : 'bg-[var(--primary-soft)] text-[var(--primary-strong)]'}`}>
                      عرض من الإدارة: خصم {plan.discount}%
                    </span>
                  ) : null}
                  {plan.original && (
                    <span className={`block text-lg line-through ${plan.highlighted ? 'text-blue-200' : 'text-gray-400'}`}>{plan.original} دج</span>
                  )}
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}> {plan.currency}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlighted ? 'bg-white/25 text-white' : 'bg-[var(--primary-soft)] text-[var(--primary-strong)]'}`}>
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className={`block w-full h-12 rounded-xl text-center leading-[3rem] font-bold transition-colors ${
                    plan.highlighted ? 'bg-white text-[var(--primary-strong)] hover:bg-blue-50' : 'bg-[var(--primary-soft)] text-[var(--primary-strong)] hover:bg-[var(--primary-strong)]/10'
                  }`}
                >
                  {cta}
                </Link>
                {user && (
                  <p className="mt-3 text-center text-xs text-gray-500">
                    أنت مسجّل دخول — تابع من حسابك مباشرةً دون إنشاء حساب جديد
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div className="max-w-5xl mx-auto mt-10">
          <Overview note="جميع المبالغ معروضة بالدينار الجزائري (دج) وتشمل الضرائب المطبقة. يمكنك الترقية أو التخفيض في أي وقت." />
        </div>
      </main>
    </div>
  )
}

function Overview({ note }: { note: string }) {
  return (
    <div className="flex items-start gap-3 bg-white border border-gray-200 rounded-2xl p-5">
      <Overline>R2 · NOTE</Overline>
      <p className="text-sm text-gray-500 leading-relaxed">{note}</p>
    </div>
  )
}