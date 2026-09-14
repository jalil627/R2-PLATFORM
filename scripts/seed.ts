import { PrismaClient } from '@prisma/client'
import type { ProductType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  // This script wipes every table and creates accounts with a known password.
  // Running it against production would destroy live data and open an admin backdoor.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'yes-i-am-sure') {
    throw new Error(
      'Refusing to seed in production: this deletes all data. Set ALLOW_PROD_SEED=yes-i-am-sure to override.'
    )
  }

  console.log('Seeding database...')

  // Clear existing data
  const tables = [
    'AuditLog', 'Transaction', 'Download', 'AffiliateClick', 'AffiliateConversion',
    'AffiliateLink', 'Wishlist', 'Follow', 'CouponUsage', 'Review', 'OrderItem',
    'Payment', 'Order', 'Payout', 'Refund', 'Notification', 'ProductFile',
    'ProductImage', 'ProductVersion', 'ProductCategory', 'ProductTag', 'Product',
    'Store', 'CreatorProfile', 'CreatorAnalytics', 'Coupon', 'Category', 'Tag',
    'Profile', 'Session', 'Account', 'VerificationToken', 'PlatformSetting',
    'HomepageSection', 'EmailTemplate', 'SupportTicketReply', 'SupportTicket',
    'Report', 'User',
  ]
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`)
  }

  // Override with SEED_PASSWORD for any shared/demo environment.
  const seedPassword = process.env.SEED_PASSWORD || 'Password123'
  const password = await bcrypt.hash(seedPassword, 12)

  // Create users
  await prisma.user.create({
    data: { email: 'superadmin@example.com', username: 'superadmin', name: 'مدير المنصة', passwordHash: password, role: 'SUPER_ADMIN', emailVerified: new Date(), profile: { create: {} } },
  })

  await prisma.user.create({
    data: { email: 'admin@example.com', username: 'admin', name: 'مشرف المنصة', passwordHash: password, role: 'ADMIN', emailVerified: new Date(), profile: { create: {} } },
  })

  const creator1 = await prisma.user.create({
    data: { email: 'creator1@example.com', username: 'ahmed', name: 'أحمد بن يوسف', passwordHash: password, role: 'CREATOR', emailVerified: new Date(), profile: { create: { bio: 'مصمم جرافيك ومطور واجهات مستخدم' } } },
  })

  const creator2 = await prisma.user.create({
    data: { email: 'creator2@example.com', username: 'sara', name: 'سارة بن عمار', passwordHash: password, role: 'CREATOR', emailVerified: new Date(), profile: { create: { bio: 'كاتبة محتوى تعليمي ومؤلفة كتب إلكترونية' } } },
  })

  const creator3 = await prisma.user.create({
    data: { email: 'creator3@example.com', username: 'mohamed', name: 'محمد مرابط', passwordHash: password, role: 'CREATOR', emailVerified: new Date(), profile: { create: { bio: 'مطور ويب وموبايل ومدرّب برمجة' } } },
  })

  const buyer1 = await prisma.user.create({
    data: { email: 'buyer@example.com', username: 'khalid', name: 'خالد بوقرة', passwordHash: password, role: 'BUYER', emailVerified: new Date(), profile: { create: {} } },
  })

  // Create creator profiles (honest: start at zero, sales are recorded by real orders)
  const cp1 = await prisma.creatorProfile.create({
    data: { userId: creator1.id, isVerified: true, verifiedAt: new Date(), commissionRate: 10, availableBalance: 0, totalEarnings: 0, totalSales: 0 },
  })
  const cp2 = await prisma.creatorProfile.create({
    data: { userId: creator2.id, isVerified: true, verifiedAt: new Date(), commissionRate: 10, availableBalance: 0, totalEarnings: 0, totalSales: 0 },
  })
  const cp3 = await prisma.creatorProfile.create({
    data: { userId: creator3.id, isVerified: true, verifiedAt: new Date(), commissionRate: 10, availableBalance: 0, totalEarnings: 0, totalSales: 0 },
  })

  // Create stores
  const store1 = await prisma.store.create({ data: { userId: creator1.id, name: 'ستوديو أحمد', slug: 'ahmed-studio', bio: 'تصميم احترافي للمنتجات الرقمية' } })
  const store2 = await prisma.store.create({ data: { userId: creator2.id, name: 'مكتبة سارة', slug: 'sara-library', bio: 'كتب إلكترونية ومحتوى تعليمي مميز' } })
  const store3 = await prisma.store.create({ data: { userId: creator3.id, name: 'أكاديمية محمد', slug: 'mohamed-academy', bio: 'دورات تعليمية في البرمجة والتصميم' } })

  // Create categories
  const cats = await Promise.all([
    prisma.category.create({ data: { name: 'Ebooks', nameAr: 'كتب إلكترونية', slug: 'ebooks', icon: 'book', sortOrder: 1 } }),
    prisma.category.create({ data: { name: 'Templates', nameAr: 'قوالب', slug: 'templates', icon: 'template', sortOrder: 2 } }),
    prisma.category.create({ data: { name: 'Courses', nameAr: 'دورات تعليمية', slug: 'courses', icon: 'course', sortOrder: 3 } }),
    prisma.category.create({ data: { name: 'Software', nameAr: 'برمجيات', slug: 'software', icon: 'code', sortOrder: 4 } }),
    prisma.category.create({ data: { name: 'Graphics', nameAr: 'رسوميات', slug: 'graphics', icon: 'image', sortOrder: 5 } }),
    prisma.category.create({ data: { name: 'Audio', nameAr: 'صوتيات', slug: 'audio', icon: 'music', sortOrder: 6 } }),
  ])

  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'تصميم', slug: 'design' } }),
    prisma.tag.create({ data: { name: 'تطوير', slug: 'development' } }),
    prisma.tag.create({ data: { name: 'تسويق', slug: 'marketing' } }),
    prisma.tag.create({ data: { name: 'productivity', slug: 'productivity' } }),
    prisma.tag.create({ data: { name: 'UI/UX', slug: 'ui-ux' } }),
    prisma.tag.create({ data: { name: 'Python', slug: 'python' } }),
    prisma.tag.create({ data: { name: 'React', slug: 'react' } }),
    prisma.tag.create({ data: { name: 'Photoshop', slug: 'photoshop' } }),
  ])

  // Create products
  const products: Array<{
    title: string
    slug: string
    description: string
    type: ProductType
    price: number
    creatorId: string
    storeId: string
    rating: number
    reviewCount: number
    downloadCount: number
    viewCount: number
    isFeatured?: boolean
    isFree?: boolean
    status: 'APPROVED'
    publishedAt: Date
  }> = [
    { title: 'كتاب أساسيات التصميم', slug: 'design-basics-ebook', description: 'كتاب شامل يغطي أساسيات التصميم الجرافيكي للمبتدئين. تعلم نظرية الألوان، الخطوط، التخطيط والمزيد.', type: 'EBOOK', price: 1500, creatorId: cp1.id, storeId: store1.id, rating: 0, reviewCount: 0, downloadCount: 0, viewCount: 0, isFeatured: true, status: 'APPROVED', publishedAt: new Date() },
    { title: 'قالب عروض تقديمية احترافي', slug: 'pro-presentation-template', description: 'قالب عروض تقديمية بألوان احترافية ومناسب لجميع المناسبات. يحتوي على أكثر من 50 شريحة.', type: 'TEMPLATE', price: 800, creatorId: cp1.id, storeId: store1.id, rating: 0, reviewCount: 0, downloadCount: 0, viewCount: 0, isFeatured: true, status: 'APPROVED', publishedAt: new Date() },
    { title: 'دورة تعلم React من الصفر', slug: 'learn-react-course', description: 'دورة تعليمية شاملة في React.js من الصفر إلى الاحتراف. أكثر من 40 ساعة فيديو مع مشاريع عملية.', type: 'COURSE', price: 4500, creatorId: cp3.id, storeId: store3.id, rating: 0, reviewCount: 0, downloadCount: 0, viewCount: 0, isFeatured: true, status: 'APPROVED', publishedAt: new Date() },
    { title: 'حزمة أيقونات وسائل التواصل', slug: 'social-media-icons', description: 'أكثر من 200 أيقونة لوسائل التواصل الاجتماعي بجودة عالية وتنسيقات متعددة.', type: 'RESOURCE', price: 500, creatorId: cp1.id, storeId: store1.id, rating: 0, reviewCount: 0, downloadCount: 0, viewCount: 0, status: 'APPROVED', publishedAt: new Date() },
    { title: 'كتاب إدارة الوقت والإنتاجية', slug: 'time-management-book', description: 'دليل عملي لإدارة الوقت وزيادة الإنتاجية. استراتيجيات مُجربة لتنظيم يومك.', type: 'EBOOK', price: 1200, creatorId: cp2.id, storeId: store2.id, rating: 0, reviewCount: 0, downloadCount: 0, viewCount: 0, isFeatured: true, status: 'APPROVED', publishedAt: new Date() },
    { title: 'دورة Python للمبتدئين', slug: 'python-beginners-course', description: 'تعلم لغة بايثون من الصفر مع مشاريع عملية. مناسب للمبتدئين التامين.', type: 'COURSE', price: 3000, creatorId: cp3.id, storeId: store3.id, rating: 0, reviewCount: 0, downloadCount: 0, viewCount: 0, status: 'APPROVED', publishedAt: new Date() },
    { title: 'قالب سيرة ذاتية عصري', slug: 'modern-cv-template', description: 'قالب سيرة ذاتية بتصميم عصري ومناسب لجميع التخصصات. قابل للتعديل في Word وCanva.', type: 'TEMPLATE', price: 300, creatorId: cp1.id, storeId: store1.id, rating: 0, reviewCount: 0, downloadCount: 0, viewCount: 0, status: 'APPROVED', publishedAt: new Date() },
    { title: 'كتاب التسويق الرقمي الشامل', slug: 'digital-marketing-book', description: 'دليل شامل للتسويق الرقمي: SEO، الإعلانات المدفوعة، التسويق عبر وسائل التواصل والمزيد.', type: 'EBOOK', price: 2000, creatorId: cp2.id, storeId: store2.id, rating: 0, reviewCount: 0, downloadCount: 0, viewCount: 0, status: 'APPROVED', publishedAt: new Date() },
    { title: 'دورة التصميم UI/UX', slug: 'uiux-design-course', description: 'تعلم تصميم واجهات المستخدم وتجربة المستخدم من الصفر باستخدام Figma.', type: 'COURSE', price: 5000, creatorId: cp3.id, storeId: store3.id, rating: 0, reviewCount: 0, downloadCount: 0, viewCount: 0, isFeatured: true, status: 'APPROVED', publishedAt: new Date() },
    { title: 'حزمة خلفيات عالية الدقة', slug: 'hd-backgrounds-pack', description: 'أكثر من 100 خلفية عالية الدقة مناسبة لمشاريع التصميم والتسويق.', type: 'RESOURCE', price: 0, creatorId: cp1.id, storeId: store1.id, isFree: true, rating: 0, reviewCount: 0, downloadCount: 0, viewCount: 0, status: 'APPROVED', publishedAt: new Date() },
    { title: 'كتاب تعلم الآلة', slug: 'ml-book', description: 'مقدمة شاملة لتعلم الآلة والتعلم العميق مع تطبيقات عملية.', type: 'EBOOK', price: 3500, creatorId: cp3.id, storeId: store3.id, rating: 0, reviewCount: 0, downloadCount: 0, viewCount: 0, status: 'APPROVED', publishedAt: new Date() },
    { title: 'قالب إيميلات تسويقية', slug: 'email-templates', description: 'مجموعة من 30 قالب إيميل تسويقي جاهز للتعديل والإرسال.', type: 'TEMPLATE', price: 900, creatorId: cp2.id, storeId: store2.id, rating: 0, reviewCount: 0, downloadCount: 0, viewCount: 0, status: 'APPROVED', publishedAt: new Date() },
  ]

  for (const p of products) {
    const product = await prisma.product.create({
      data: {
        ...p,
        seoTitle: p.title,
        seoDescription: p.description.substring(0, 150),
      },
    })

    await prisma.productCategory.create({
      data: { productId: product.id, categoryId: cats[Math.floor(Math.random() * cats.length)].id },
    })

    const productTags = [...tags].sort(() => Math.random() - 0.5).slice(0, 3)
    for (const tag of productTags) {
      await prisma.productTag.create({ data: { productId: product.id, tagId: tag.id } })
    }
  }

  // Create reviews
  const allProducts = await prisma.product.findMany({ where: { status: 'APPROVED' } })
  for (const product of allProducts.slice(0, 6)) {
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: buyer1.id,
        rating: Math.floor(Math.random() * 2) + 4,
        title: 'منتج ممتاز',
        text: 'أنصح الجميع بشراء هذا المنتج. جودة عالية ومحتوى قيم.',
        isVerifiedPurchase: true,
      },
    })
  }

  // Create coupons
  await prisma.coupon.create({ data: { creatorId: cp1.id, code: 'WELCOME20', discountType: 'percentage', discountValue: 20, maxUses: 100, currentUses: 15, isActive: true } })
  await prisma.coupon.create({ data: { creatorId: cp2.id, code: 'SAVE500', discountType: 'fixed', discountValue: 500, minOrderAmount: 1500, maxUses: 50, currentUses: 8, isActive: true } })

  // Create a demo digital file on local disk for download testing
  const demoFileKey = 'uploads/demo-product.txt'
  const demoFileDir = path.join(process.cwd(), 'storage', 'uploads', 'uploads')
  fs.mkdirSync(demoFileDir, { recursive: true })
  fs.writeFileSync(path.join(process.cwd(), 'storage', 'uploads', demoFileKey), 'هذا ملف تجريبي من منصة سوق رقمي. شكراً لشرائك!' )

  // Attach the demo file to the first approved product
  const demoProduct = await prisma.product.findFirst({ where: { slug: 'design-basics-ebook' } })
  if (demoProduct) {
    await prisma.productFile.create({
      data: {
        productId: demoProduct.id,
        name: 'demo-product.txt',
        url: demoFileKey,
        size: Buffer.byteLength('هذا ملف تجريبي من منصة سوق رقمي. شكراً لشرائك!'),
        mimeType: 'text/plain',
      },
    })
  }

  const cvProduct = await prisma.product.findFirst({ where: { slug: 'modern-cv-template' } })
  if (cvProduct) {
    await prisma.productFile.create({
      data: {
        productId: cvProduct.id,
        name: 'demo-product.txt',
        url: demoFileKey,
        size: Buffer.byteLength('هذا ملف تجريبي من منصة سوق رقمي. شكراً لشرائك!'),
        mimeType: 'text/plain',
      },
    })
  }

  console.log('Seed complete!')
  console.log('Demo accounts:')
  console.log(`  Super Admin: superadmin@example.com / ${seedPassword}`)
  console.log(`  Admin: admin@example.com / ${seedPassword}`)
  console.log(`  Creator 1: creator1@example.com / ${seedPassword}`)
  console.log(`  Creator 2: creator2@example.com / ${seedPassword}`)
  console.log(`  Creator 3: creator3@example.com / ${seedPassword}`)
  console.log(`  Buyer: buyer@example.com / ${seedPassword}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
