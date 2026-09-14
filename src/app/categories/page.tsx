import Link from 'next/link'
import SiteHeader from '@/components/layout/site-header'
import PageHero from '@/components/design/page-head'

const categories = [
  { name: 'كتب إلكترونية', slug: 'ebooks', icon: 'book', count: 150, gradient: 'from-blue-600 to-blue-800' },
  { name: 'قوالب', slug: 'templates', icon: 'template', count: 230, gradient: 'from-emerald-500 to-teal-600' },
  { name: 'دورات تعليمية', slug: 'courses', icon: 'course', count: 95, gradient: 'from-amber-500 to-orange-600' },
  { name: 'برمجيات', slug: 'software', icon: 'code', count: 80, gradient: 'from-cyan-500 to-blue-600' },
  { name: 'رسوميات', slug: 'graphics', icon: 'image', count: 180, gradient: 'from-pink-500 to-rose-600' },
  { name: 'صوتيات', slug: 'audio', icon: 'music', count: 60, gradient: 'from-violet-500 to-blue-700' },
]

const iconSvg: Record<string, string> = {
  book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  template: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm-2 5h20v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9z',
  course: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
  code: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  music: 'M9 19V6l12-3v13m-12 3a3 3 0 11-6 0 3 3 0 016 0zm12-3a3 3 0 11-6 0 3 3 0 016 0z',
}

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <PageHero
          index="05"
          overline="R2 · CATALOG"
          title="الفئات"
          description="استكشف المنتجات حسب الفئة — كل تصنيف يضم مجموعة مختارة من أعمال مبدعين موثقين."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/marketplace?category=${cat.slug}`} className="group overflow-hidden rounded-2xl bg-white border border-gray-200 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-all">
              <div className={`h-36 bg-gradient-to-br ${cat.gradient} flex items-center justify-center relative`}>
                <svg className="w-12 h-12 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconSvg[cat.icon]} />
                </svg>
                <span className="absolute top-3 left-3 text-2xl font-extrabold text-white/20 select-none" aria-hidden="true">
                  {categories.indexOf(cat) + 1}
                </span>
              </div>
              <div className="p-5">
                <p className="overline-label text-[10px] font-semibold tracking-widest text-[var(--primary-strong)] mb-1.5">R2 · CATEGORY 0{categories.indexOf(cat) + 1}</p>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[var(--ink)]">{cat.name}</h3>
                  <span className="text-sm text-gray-500">{cat.count} منتج</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}