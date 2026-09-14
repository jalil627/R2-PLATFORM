import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirmPassword'],
})

export const productSchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل').max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  type: z.enum(['EBOOK', 'PDF', 'ZIP', 'TEMPLATE', 'COURSE', 'VIDEO', 'AUDIO', 'SOFTWARE', 'RESOURCE', 'BUNDLE', 'FREE', 'PAY_WHAT_YOU_WANT']),
  price: z.number().min(0, 'السعر يجب أن يكون 0 على الأقل'),
  compareAtPrice: z.number().min(0).optional(),
  isFree: z.boolean().default(false),
  isPayWhatYouWant: z.boolean().default(false),
  minPrice: z.number().min(0).optional(),
  license: z.string().optional(),
  requirements: z.string().optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.string().optional(),
  categoryIds: z.array(z.string()).min(1, 'اختر فئة واحدة على الأقل'),
  tagIds: z.array(z.string()).optional(),
})

export const storeSchema = z.object({
  name: z.string().min(2, 'اسم المتجر يجب أن يكون حرفين على الأقل').max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة فقط'),
  bio: z.string().max(2000).optional(),
  links: z.object({
    website: z.string().url().optional().or(z.literal('')),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
  }).optional(),
})

export const couponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(0.01),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  appliesTo: z.enum(['all', 'specific']),
  productId: z.string().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
})

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  text: z.string().max(2000).optional(),
})

export const payoutRequestSchema = z.object({
  amount: z.number().min(100, 'الحد الأدنى للسحب 100 دج'),
  method: z.string().min(1, 'اختر طريقة السحب'),
  details: z.record(z.string()).optional(),
})

export const checkoutSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  name: z.string().min(2),
  couponCode: z.string().optional(),
  paymentMethod: z.string().min(1),
})

export const checkoutApiSchema = z.object({
  productId: z.string().min(1, 'معرّف المنتج مطلوب'),
  couponCode: z.string().optional(),
  paymentMethod: z.string().optional(),
})

export const reviewInputSchema = z.object({
  productId: z.string().min(1, 'معرّف المنتج مطلوب'),
  rating: z.number().int().min(1).max(10).or(z.string().regex(/^\d+$/).transform(Number)),
  title: z.string().max(120).optional(),
  text: z.string().max(2000).optional(),
})

export const ProductCreateInputSchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل').max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  type: z.enum(['EBOOK', 'PDF', 'ZIP', 'TEMPLATE', 'COURSE', 'VIDEO', 'AUDIO', 'SOFTWARE', 'RESOURCE', 'BUNDLE', 'FREE', 'PAY_WHAT_YOU_WANT']),
  price: z.number().min(0, 'السعر يجب أن يكون 0 على الأقل').optional(),
  compareAtPrice: z.number().min(0).nullable().optional(),
  isFree: z.boolean().optional(),
  isPayWhatYouWant: z.boolean().optional(),
  minPrice: z.number().min(0).nullable().optional(),
  license: z.string().optional(),
  requirements: z.string().optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.string().optional(),
  categoryIds: z.array(z.string()).max(20).optional(),
  tagIds: z.array(z.string()).max(20).optional(),
  status: z.enum(['draft', 'published', 'pending']).optional(),
  files: z.array(z.object({
    name: z.string().min(1),
    url: z.string().min(1),
    size: z.number().min(0).optional(),
    mimeType: z.string().optional(),
  })).max(20).optional(),
  images: z.array(z.object({
    url: z.string().min(1),
    name: z.string().optional(),
    alt: z.string().optional(),
    size: z.number().optional(),
  })).max(10).optional(),
})

export const reportSchema = z.object({
  targetType: z.enum(['product', 'creator', 'review']),
  targetId: z.string(),
  reason: z.enum(['COPYRIGHT', 'SCAM', 'SPAM', 'MISLEADING', 'OTHER']),
  description: z.string().max(2000).optional(),
})

export const adminSettingsSchema = z.object({
  platformFeePercent: z.number().min(0).max(100),
  platformName: z.string().min(1),
  platformUrl: z.string().url(),
  defaultCurrency: z.string().min(3),
  maintenanceMode: z.boolean(),
  allowRegistration: z.boolean(),
})
