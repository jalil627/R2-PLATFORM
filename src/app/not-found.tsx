import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl brand-gradient flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(37,78,219,0.8)]">
          <span className="text-white font-bold text-2xl">R2</span>
          <span className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-[var(--gold)] border-2 border-white" />
        </div>
        <p className="overline-label inline-flex items-center gap-2 justify-center mb-3 text-[11px] font-semibold text-[var(--primary-strong)]">
          <span className="h-px w-6 bg-[var(--a-500)]" />
          R2 · 404
          <span className="h-px w-6 bg-[var(--a-500)]" />
        </p>
        <h1 className="display-tight text-3xl font-bold text-[var(--ink)] mb-3">الصفحة غير موجودة</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          الرابط الذي حاولت الوصول إليه غير متوفر أو تم نقله. يمكنك العودة للمنصة والاستمرار في التصفح.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl brand-gradient text-white text-sm font-bold hover:brightness-110 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            الصفحة الرئيسية
          </Link>
          <Link href="/marketplace" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-100 transition-colors">
            استكشف السوق
          </Link>
        </div>
      </div>
    </div>
  )
}