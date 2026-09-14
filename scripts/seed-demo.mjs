import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const CATEGORIES = [
  { slug: 'templates', name: 'Templates', nameAr: 'قوالب جاهزة' },
  { slug: 'ebooks', name: 'Ebooks', nameAr: 'كتب إلكترونية' },
  { slug: 'design', name: 'Design', nameAr: 'تصميم' },
  { slug: 'courses', name: 'Courses', nameAr: 'دورات' },
]

const PRODUCTS = [
  {
    title: 'قالب سيرة ذاتية احترافي جاهز للتعديل',
    type: 'TEMPLATE',
    price: 450,
    compareAtPrice: 900,
    shortDescription: 'قالب سيرة ذاتية عصري قابل للتعديل بالكامل، مناسب لسوق العمل الجزائري.',
    description: 'قالب سيرة ذاتية احترافي بألوان عصرية، يتضمن صفحتين وقسم مهارات وتجربة عمل.\n\n- صيغة Word و PDF\n- خطوط عربية مجانية\n- سهل التعديل في 10 دقائق',
  },
  {
    title: 'كتاب: أسرار البيع عبر الإنترنت للمبتدئين',
    type: 'EBOOK',
    price: 300,
    shortDescription: 'دليل عملي بالعربية لبناء أول متجرك الرقمي وتحقيق أول مبيعاتك.',
    description: 'كتاب إلكتروني شامل يأخذك خطوة بخطوة من الفكرة إلى أول عملية بيع:\n\n- اختيار فكرتك الصحيحة\n- بناء المتجر\n- جذب العملاء\n- استراتيجيات التسويق المجانية',
  },
  {
    title: 'حزمة 30 قالب تصميم لوسائل التواصل الاجتماعي',
    type: 'RESOURCE',
    price: 990,
    compareAtPrice: 1500,
    shortDescription: '30 قالب جاهز لمنشورات فيسبوك، انستغرام، وستوري بصيغة PSD.',
    description: 'مجموعة كبيرة من القوالب الجاهزة للتعديل مباشرة:\n\n- 30 قالب منشور\n- 10 قوالب ستوري\n- ملفات PSD منظمة بالطبقات\n- دليل استخدام بالعربية',
  },
  {
    title: 'نموذج خطة عمل متجر إلكتروني (Word)',
    type: 'RESOURCE',
    price: 250,
    shortDescription: 'نموذج جاهز لخطة عمل متكاملة لمتجرك الإلكتروني بصيغة Word.',
    description: 'وفّر وقتك مع نموذج خطة عمل منظم وجاهز للتعبئة:\n\n- تحليل السوق والمنافسين\n- خطة تسويقية\n- توقعات مالية\n- خطة تشغيلية',
  },
  {
    title: 'دليل إدارة مشاريع للفريلانسرز (مختصر)',
    type: 'PDF',
    price: 150,
    shortDescription: 'دليل PDF موجز لإدارة مشاريعك وتنظيم وقتك كفريلانسر.',
    description: 'ملخص عملي مستخلص من أفضل الممارسات:\n\n- تسعير مشاريعك\n- إدارة المواعيد النهائية\n- التعامل مع العملاء\n- قوالب جاهزة للنسخ',
  },
  {
    title: 'مكتبة أيقونات متجهة للمشاريع الشخصية',
    type: 'FREE',
    price: 0,
    isFree: true,
    shortDescription: 'مجموعة أيقونات SVG مجانية للاستخدام التجاري والشخصي.',
    description: 'مكتبة خفيفة وتناسب أغلب المشاريع:\n\n- 100+ أيقونة SVG\n- رخصة تجارية حرة\n- منظمة في ملفات نظيفة',
  },
]

async function main() {
  console.log('Seeding demo data...')

  const admin = await prisma.user.findUnique({ where: { email: 'demo@r2.dev' } })

  let creator = admin
  if (!creator) {
    creator = await prisma.user.create({
      data: {
        name: 'استوديو الرقمية',
        email: 'demo@r2.dev',
        passwordHash: await bcrypt.hash('demo1234', 12),
        role: 'CREATOR',
        memberNo: 1,
        profile: { create: {} },
      },
    })
    await prisma.platformSetting.upsert({
      where: { key: 'last_member_no' },
      update: { value: 1 },
      create: { key: 'last_member_no', value: 1 },
    })
  }

  let creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId: creator.id } })
  if (!creatorProfile) {
    creatorProfile = await prisma.creatorProfile.create({ data: { userId: creator.id, commissionRate: 10 } })
  }

  let store = await prisma.store.findUnique({ where: { userId: creator.id } })
  if (!store) {
    store = await prisma.store.create({
      data: {
        userId: creator.id,
        name: 'استوديو الرقمية',
        slug: 'studio-raqmi',
        bio: 'منتجات رقمية عربية الصنع: قوالب، كتب، وتصاميم بجودة عالية وأسعار مناسبة.',
      },
    })
  }

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { nameAr: cat.nameAr, isActive: true },
      create: { slug: cat.slug, name: cat.name, nameAr: cat.nameAr, isActive: true },
    })
  }

  const existingCount = await prisma.product.count()
  if (existingCount === 0) {
    let i = 0
    for (const p of PRODUCTS) {
      const category = await prisma.category.findFirst({ where: { slug: CATEGORIES[i % CATEGORIES.length].slug } })
      const slug = p.title.replace(/\s+/g, '-').slice(0, 40).toLowerCase()
      const product = await prisma.product.create({
        data: {
          creatorId: creatorProfile.id,
          storeId: store.id,
          title: p.title,
          slug: `${slug}-${Date.now().toString(36)}`,
          description: p.description,
          shortDescription: p.shortDescription,
          type: p.type,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          isFree: p.isFree || p.price === 0,
          status: 'APPROVED',
          publishedAt: new Date(),
          rating: 8.2 + (i % 2),
          reviewCount: 3 + i,
          downloadCount: 40 + i * 17,
          viewCount: 120 + i * 55,
        },
      })
      if (category) {
        await prisma.$executeRawUnsafe(
          `INSERT OR IGNORE INTO "ProductCategory" ("productId", "categoryId") VALUES ('${product.id}', '${category.id}')`
        )
      }
      await prisma.review.create({
        data: {
          productId: product.id,
          userId: creator.id,
          rating: 8 + (i % 2),
          text: i % 2 === 0 ? 'منتج ممتاز وواضح، أنصح به بشدة.' : 'جودة عالية وسعر مناسب. شكرًا.',
        },
      })
      i++
    }
  }

  await prisma.platformSetting.upsert({
    where: { key: 'platform_name' },
    update: { value: 'R2 - PLATFORM' },
    create: { key: 'platform_name', value: 'R2 - PLATFORM' },
  })

  console.log('Done. products:', await prisma.product.count(), '| categories:', await prisma.category.count())
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})