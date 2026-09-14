import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Email] Resend not configured. Would send:', options.subject, 'to', options.to)
    }
    return false
  }

  try {
    await resend.emails.send({
      from: options.from || process.env.EMAIL_FROM || 'noreply@r2platform.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    return true
  } catch (error) {
    console.error('[Email] Failed to send:', error)
    return false
  }
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

export function getWelcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: `مرحبًا ${name}!`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>مرحبًا ${name}!</h1>
        <p>شكرًا لتسجيلك في R2 - PLATFORM. حسابك جاهز للبدء.</p>
        <p>يمكنك الآن استكشاف السوق وفتح متجرك الخاص.</p>
        <a href="${process.env.PLATFORM_URL}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">ابدأ الآن</a>
      </div>
    `,
  }
}

export function getPurchaseConfirmationEmail(name: string, productName: string, orderNumber: string): { subject: string; html: string } {
  return {
    subject: `تأكيد الطلب ${orderNumber}`,
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>تم تأكيد طلبك!</h1>
        <p>مرحبًا ${name}،</p>
        <p>تم استلام طلبك رقم <strong>${orderNumber}</strong> بنجاح.</p>
        <p>المنتج: <strong>${productName}</strong></p>
        <p>يمكنك تحميل المنتج من صفحة مشترياتك.</p>
        <a href="${process.env.PLATFORM_URL}/dashboard/purchases" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">عرض مشترياتي</a>
      </div>
    `,
  }
}

export function getNewSaleEmail(creatorName: string, productName: string, buyerEmail: string, amount: number): { subject: string; html: string } {
  return {
    subject: 'بيع جديد!',
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>🎉 بيع جديد!</h1>
        <p>مرحبًا ${creatorName}،</p>
        <p>لقد تم بيع <strong>${productName}</strong> للعميل <strong>${buyerEmail}</strong>.</p>
        <p>المبلغ: <strong>${Number(amount).toLocaleString('ar-DZ-u-nu-latn')} دج</strong></p>
        <a href="${process.env.PLATFORM_URL}/creator/dashboard" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">عرض لوحة التحكم</a>
      </div>
    `,
  }
}

export function getPasswordResetEmail(name: string, resetUrl: string): { subject: string; html: string } {
  return {
    subject: 'إعادة تعيين كلمة المرور',
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>إعادة تعيين كلمة المرور</h1>
        <p>مرحبًا ${name}،</p>
        <p>تلقينا طلبًا لإعادة تعيين كلمة المرور. انقر على الرابط أدناه:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">إعادة التعيين</a>
        <p style="color: #666; margin-top: 16px;">إ لم تطلب إعادة التعيين، تجاهل هذه الرسالة.</p>
      </div>
    `,
  }
}

export function getVerificationEmail(name: string, verifyUrl: string): { subject: string; html: string } {
  return {
    subject: 'تحقق من بريدك الإلكتروني',
    html: `
      <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>تحقق من بريدك</h1>
        <p>مرحبًا ${name}،</p>
        <p>انقر على الرابط أدناه للتحقق من بريدك الإلكتروني:</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">تحقق الآن</a>
      </div>
    `,
  }
}
