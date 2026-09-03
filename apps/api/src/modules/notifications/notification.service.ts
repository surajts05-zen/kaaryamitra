import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'leave.applied'
  | 'leave.approved'
  | 'leave.rejected'
  | 'workflow.assigned'
  | 'workflow.completed'
  | 'workflow.rejected';

interface CreateNotificationInput {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | undefined;
  /** If provided, also send an email to this address */
  email?: string | undefined;
}

// ─── Create & persist in-app notification ─────────────────────────────────────

export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      channel: 'IN_APP',
    },
  });

  // Fire-and-forget email (never throw — always degrade gracefully)
  if (input.email) {
    sendEmail({
      to: input.email,
      subject: input.title,
      html: buildEmailHtml(input.title, input.body, input.link),
    }).catch((err) => logger.warn({ err }, 'Failed to send notification email'));
  }

  return notification;
}

// ─── List notifications for a user ───────────────────────────────────────────

export async function listNotifications(userId: string, limit = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function countUnread(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

// ─── Mark as read ─────────────────────────────────────────────────────────────

export async function markRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

// ─── Email sender (console-log fallback when SMTP not configured) ─────────────

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload) {
  // Query DB settings first
  let dbSettings: any = null;
  try {
    dbSettings = await (prisma as any).platformSettings.findUnique({ where: { id: 'global' } });
  } catch (err) {
    // fallback gracefully
  }

  const host = dbSettings?.smtpHost || env.SMTP_HOST;
  const port = dbSettings?.smtpPort || env.SMTP_PORT || 587;
  const user = dbSettings?.smtpUser || env.SMTP_USER;
  const pass = dbSettings?.smtpPass || env.SMTP_PASS;
  const from = dbSettings?.smtpFrom || env.SMTP_FROM || user || 'noreply@kaaryamitra.com';

  if (!host || !user || !pass) {
    // Dev mode: just log the email
    logger.info(
      { to: payload.to, subject: payload.subject },
      '[EMAIL-DEV] Notification email (SMTP not configured — logging only)',
    );
    return;
  }

  // Lazy-import nodemailer only when SMTP is configured
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });

  logger.info({ to: payload.to, subject: payload.subject }, 'Notification email sent');
}

// ─── Email HTML template ──────────────────────────────────────────────────────

export function buildEmailHtml(title: string, body: string, link?: string) {
  const ctaBlock = link
    ? `<p style="margin-top:24px">
        <a href="${link}" style="background:#A8E600;color:#0D4F3C;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          View Details →
        </a>
       </p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="600" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1B5E3B,#0D4F3C);padding:32px 40px">
            <span style="color:#A8E600;font-size:22px;font-weight:700">KaaryaMitra</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px">
            <h1 style="margin:0 0 12px;font-size:20px;color:#111827">${title}</h1>
            <p style="margin:0;color:#6b7280;font-size:15px;line-height:1.6">${body}</p>
            ${ctaBlock}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb">
            <p style="margin:0;color:#9ca3af;font-size:12px">
              This is an automated notification from KaaryaMitra. Please do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
