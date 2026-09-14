'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

interface AuthShellProps {
  title: string
  subtitle: string
  brandTitle: ReactNode
  brandDesc: string
  children: ReactNode
  footer: ReactNode
}

export default function AuthShell({ title, subtitle, brandTitle, brandDesc, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--ink)]">
      <style>{`
        @keyframes auth-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes auth-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes auth-aurora { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(4%, -6%) scale(1.08); } }
        @keyframes auth-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
        .auth-rise { animation: auth-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .auth-rise-1 { animation-delay: 0.08s; }
        .auth-rise-2 { animation-delay: 0.16s; }
        .auth-float { animation: auth-float 6s ease-in-out infinite; }
        .auth-float-late { animation: auth-float 7.5s ease-in-out 1.2s infinite; }
        .auth-aurora { animation: auth-aurora 12s ease-in-out infinite; }
        .auth-shake { animation: auth-shake 0.3s ease-in-out 2; }
      `}</style>

      {/* ── Form side ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="auth-rise text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <div className="relative h-11 w-11 rounded-2xl brand-gradient flex items-center justify-center shadow-lg shadow-[var(--a-600)]/30 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
                <span className="text-white font-bold text-base tracking-tight">R2</span>
                <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-[var(--gold)] border-2 border-white" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight">R2 - <span className="brand-text">PLATFORM</span></span>
            </Link>
            <h1 className="display-tight text-3xl font-black">{title}</h1>
            <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
          </div>

          <div className="auth-rise auth-rise-1 bg-white rounded-3xl shadow-[0_24px_60px_-24px_rgba(37,78,219,0.25)] border border-gray-100 p-6 sm:p-8">
            {children}
          </div>

          <div className="auth-rise auth-rise-2 text-center mt-6 text-sm text-gray-500">
            {footer}
          </div>
        </div>
      </div>

      {/* ── Brand side ────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#0b1026] text-white items-center justify-center p-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="auth-aurora absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full bg-[radial-gradient(circle,rgba(59,109,246,0.45)_0%,transparent_65%)]" />
          <div className="auth-aurora absolute -bottom-40 -right-24 w-[38rem] h-[38rem] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.20)_0%,transparent_65%)]" style={{ animationDelay: '3s' }} />
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)', backgroundSize: '44px 44px', maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 75%)' }} />
        </div>

        <div className="auth-rise auth-rise-1 relative max-w-md w-full">
          <p className="overline-label text-[11px] text-amber-300/90 mb-4">R2 · MARKETPLACE</p>
          <h2 className="display-tight text-4xl xl:text-5xl font-black leading-[1.25]">
            {brandTitle}
          </h2>
          <p className="mt-4 text-white/60 leading-relaxed">{brandDesc}</p>

          <div className="mt-8 space-y-3">
            <div className="auth-float flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md p-4">
              <span className="shrink-0 w-11 h-11 rounded-2xl bg-emerald-400/15 text-emerald-300 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
              <div>
                <p className="font-black text-sm">سحب حقيقي لأرباحك</p>
                <p className="text-xs text-white/50 mt-0.5">CCP · تحويل بنكي · بريدي موب</p>
              </div>
            </div>
            <div className="auth-float-late flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md p-4">
              <span className="shrink-0 w-11 h-11 rounded-2xl bg-amber-400/15 text-amber-300 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </span>
              <div>
                <p className="font-black text-sm">دفع آمن ومحمي</p>
                <p className="text-xs text-white/50 mt-0.5">حماية للمشتري والبائع في كل عملية</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
