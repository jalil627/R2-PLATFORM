import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'

export type AlertSeverity = 'info' | 'warning' | 'critical'

/**
 * Records an operational problem for the admin inbox. Fire-and-forget safe:
 * it never throws, so alerting can sit inside any catch block without
 * risking the primary flow.
 */
export async function raiseAlert(
  severity: AlertSeverity,
  title: string,
  message: string,
  link?: string,
  context?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.systemAlert.create({
      data: {
        severity,
        title: title.slice(0, 200),
        message: message.slice(0, 2000),
        link: link?.slice(0, 500) || null,
        context: (context || {}) as unknown as Prisma.InputJsonValue,
      },
    })
  } catch (error) {
    console.error('[Alert] failed to record:', title, error)
  }
}
