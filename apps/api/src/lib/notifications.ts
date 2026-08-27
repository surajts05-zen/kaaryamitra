import type { NotificationType, NotificationChannel } from '@kaaryamitra/shared-types';
import { prisma } from './prisma.js';
import { logger } from './logger.js';

export interface CreateNotificationOptions {
  tenantId: string;
  userId: string;
  employeeId?: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  channel?: NotificationChannel;
}

/**
 * NotificationService — abstract interface for multi-channel notifications.
 * Currently implements IN_APP and EMAIL stubs.
 * Extend with push/SMS adapters without changing the call sites.
 */
export class NotificationService {
  /**
   * Send a notification to a single user.
   * Always creates an in-app record; routes to additional channels based on `channel`.
   */
  static async send(options: CreateNotificationOptions): Promise<void> {
    const {
      tenantId,
      userId,
      employeeId,
      type,
      title,
      body,
      link,
      channel = 'IN_APP',
    } = options;

    try {
      // Always create in-app notification record
      await prisma.notification.create({
        data: {
          tenantId,
          userId,
          employeeId: employeeId ?? null,
          type,
          title,
          body,
          link: link ?? null,
          channel,
        },
      });

      // Route to additional channels
      if (channel === 'EMAIL') {
        await NotificationService.sendEmail({ userId, title, body, ...(link !== undefined ? { link } : {}) });
      }

      logger.debug({ userId, type, channel }, 'Notification sent');
    } catch (err) {
      // Non-blocking — notification failure should not break the primary operation
      logger.error({ err, userId, type }, 'Failed to send notification');
    }
  }

  /**
   * Send to all employees in a tenant (e.g. announcements).
   */
  static async sendToTenant(
    tenantId: string,
    options: Omit<CreateNotificationOptions, 'tenantId' | 'userId'>,
  ): Promise<void> {
    const employees = await prisma.employee.findMany({
      where: { tenantId },
      select: { userId: true, id: true },
    });

    await Promise.allSettled(
      employees.map((emp) =>
        NotificationService.send({
          ...options,
          tenantId,
          userId: emp.userId,
          employeeId: emp.id,
        }),
      ),
    );
  }

  // ── Private adapters ──────────────────────────────────────────────────────

  private static async sendEmail(options: {
    userId: string;
    title: string;
    body: string;
    link?: string;
  }): Promise<void> {
    // TODO Phase 9: Implement Nodemailer/Resend email sending
    // const user = await prisma.user.findUnique({ where: { id: options.userId } });
    // await mailer.send({ to: user.email, subject: options.title, html: renderTemplate(...) });
    logger.debug({ userId: options.userId }, '[STUB] Email notification queued');
  }
}
