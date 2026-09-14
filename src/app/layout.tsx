import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from 'next/font/google'
import './globals.css'

const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
})

const latinFont = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-latin',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'R2 - PLATFORM | منصة بيع المنتجات الرقمية',
    template: '%s | R2 - PLATFORM',
  },
  description: 'منصة جزائرية لبيع وشراء المنتجات الرقمية. افتح متجرك، ارفع منتجاتك، وابدأ البيع.',
  keywords: ['منتجات رقمية', 'متجر إلكتروني', 'كتب إلكترونية', 'دورات تعليمية', 'قوالب', 'الجزائر', 'البيع عبر الإنترنت'],
  openGraph: {
    type: 'website',
    locale: 'ar_DZ',
    siteName: 'R2 - PLATFORM',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`light ${arabicFont.variable} ${latinFont.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased">
        {children}
      </body>
    </html>
  )
}