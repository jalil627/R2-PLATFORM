# سوق رقمي (Souq Raqmi) — Digital Product Marketplace

منصة عربية (رئيسية) متكاملة لبيع وشراء المنتجات الرقمية، مصممة لتبدأ في الجزائر ثم تتوسع للسوق العربي الأوسع. مستوحاة من وظائف Gumroad وPayhip لكن بهوية وواجهة وكود أصلي بالكامل.

## الميزات

- **سوق رقمي**: بحث، فئات، فلاتر، فرز، ترقيم صفحات
- **متاجر المبدعين**: صفحة متجر مخصصة لكل مبدع
- **إدارة المنتجات**: إنشاء، تعديل، نشر، أرشفة مع ملفات وصور وإصدارات
- **الدفع والطلبات**: تجريد مزوّد الدفع، webhooks، وحسابات العملات
- **تسليم آمن**: روابط تحميل موقعة ومنتهية الصلاحية
- **لوحة تحكم المبدع**: إحصائيات، أرباح، عملاء، كوبونات
- **لوحة تحكم المرجع**: مستخدمون، منتجات، طلبات، إعدادات، تدقيق
- **كوبونات، مراجعات، مفضلة، متابعة، تسويق بالعمولة**
- **عربي RTL + إنجليزي LTR**، وضع فاتح/داكن، تصميم متجاوب

## المتطلبات

- Node.js 18+
- PostgreSQL
- (اختياري) حساب S3-compatible للتخزين
- (اختياري) مفتاح Resend للبريد
- (اختياري) بيانات Google OAuth للدخول عبر جوجل

## التثبيت والتشغيل محليًا

```bash
# 1. تثبيت الاعتمادات
npm install

# 2. إعداد ملف البيئة
cp .env.example .env
# عدّل قيم DATABASE_URL وكذلك أي مفاتيح متاحة

# 3. إنشاء قاعدة البيانات
npx prisma migrate dev --name init

# 4. (اختياري) زرع بيانات تجريبية
npm run db:seed

# 5. تشغيل التطبيق
npm run dev
```

افتح `http://localhost:3000`.

### حسابات تجريبية (بعد seeding)

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| مدير عام | superadmin@example.com | Password123 |
| مدير | admin@example.com | Password123 |
| مبدع 1 | creator1@example.com | Password123 |
| مبدع 2 | creator2@example.com | Password123 |
| مبدع 3 | creator3@example.com | Password123 |
| مشتري | buyer@example.com | Password123 |

## المتغيرات البيئية

انظر `.env.example` لكل المتغيرات. أهمها:

- `DATABASE_URL` — سلسلة اتصال PostgreSQL
- `NEXTAUTH_SECRET` / `AUTH_SECRET` — أسرار الجلسات/المصادقة
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — جوجل OAuth
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` — تخزين الملفات
- `RESEND_API_KEY` — إرسال البريد
- `PAYMENT_PROVIDER` — مزوّد الدفع (يُترك فارغًا للوضع اليدوي)

## الأوامر

```bash
npm run dev          # التطوير
npm run build        # البناء
npm run start        # التشغيل
npm run db:generate  # توليد Prisma client
npm run db:migrate   # الترحيلات
npm run db:seed      # بيانات تجريبية
npm run db:studio    # واجهة قاعدة البيانات
npm run test         # الاختبارات
```

## النشر للإنتاج

1. جهّز PostgreSQL والسلسلة المتصلة
2. عيّن كل المتغيرات البيئية الآمنة
3. شغّل `npx prisma migrate deploy`
4. شغّل `npm run build` ثم `npm run start`
5. (اختياري) انشر على Vercel / Railway / منصة سحابية، مع ربط PostgreSQL وS3

## التكاملات التي تتطلب بيانات حقيقية

لتفعيل أي تكامل، عيّن القيم في `.env`. بدونها يعمل التطبيق في **وضع معطّل**:

- **Google OAuth** — `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- **S3 storage** — `S3_ENDPOINT` + `S3_BUCKET` + `S3_ACCESS_KEY` + `S3_SECRET_KEY`
- **Email (Resend)** — `RESEND_API_KEY`
- **Payment provider** — `PAYMENT_PROVIDER` + مفاتيح المزوّد (بلا بوابة يعمل الدفع اليدوي)