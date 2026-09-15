import type { NotificationType, NotificationChannel } from '@kaaryamitra/shared-types';
import { prisma } from './prisma.js';
import { logger } from './logger.js';
import nodemailer from 'nodemailer';

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
    try {
      const user = await prisma.user.findUnique({ where: { id: options.userId } });
      if (!user || !user.email) return;

      const platformSettings = await (prisma as any).platformSettings.findUnique({
        where: { id: 'global' },
      });

      if (!platformSettings?.smtpHost || !platformSettings?.smtpUser || !platformSettings?.smtpPass) {
        logger.debug({ userId: options.userId }, '[STUB] Email notification queued (No SMTP settings found)');
        return;
      }

      const transporter = nodemailer.createTransport({
        host: platformSettings.smtpHost,
        port: platformSettings.smtpPort || 587,
        secure: platformSettings.smtpPort === 465,
        auth: {
          user: platformSettings.smtpUser,
          pass: platformSettings.smtpPass,
        },
      });

      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>${options.title}</h2>
          <p>${options.body}</p>
          ${options.link ? `<p><a href="${options.link}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">View Details</a></p>` : ''}
        </div>
      `;

      await transporter.sendMail({
        from: platformSettings.smtpFrom || '"KaaryaMitra" <noreply@kaaryamitra.com>',
        to: user.email,
        subject: options.title,
        html: htmlContent,
      });

      logger.debug({ userId: options.userId }, 'Email notification sent successfully');
    } catch (err) {
      logger.error({ err, userId: options.userId }, 'Failed to send email notification');
    }
  }

  static async sendSystemEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const platformSettings = await (prisma as any).platformSettings.findUnique({
        where: { id: 'global' },
      });

      if (!platformSettings?.smtpHost || !platformSettings?.smtpUser || !platformSettings?.smtpPass) {
        logger.debug({ to }, '[STUB] System email queued (No SMTP settings found)');
        return;
      }

      const transporter = nodemailer.createTransport({
        host: platformSettings.smtpHost,
        port: platformSettings.smtpPort || 587,
        secure: platformSettings.smtpPort === 465,
        auth: {
          user: platformSettings.smtpUser,
          pass: platformSettings.smtpPass,
        },
      });

      await transporter.sendMail({
        from: platformSettings.smtpFrom || '"KaaryaMitra" <noreply@kaaryamitra.com>',
        to,
        subject,
        html,
      });
      logger.debug({ to }, 'System email sent successfully');
    } catch (err) {
      logger.error({ err, to }, 'Failed to send system email');
    }
  }
}
