import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { createNotification } from '../modules/notifications/notification.service.js';

export async function checkDocumentExpiries() {
  logger.info('Running daily document expiry check...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Targets: 30 days, 7 days, 1 day, and 0 days (expired today)
  const targetDays = [30, 7, 1, 0];

  for (const days of targetDays) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + days);

    const docs = await prisma.document.findMany({
      where: {
        status: 'VALID',
        expiresAt: targetDate,
      },
      include: {
        employee: { select: { userId: true, firstName: true, lastName: true } },
        category: true,
      },
    });

    for (const doc of docs) {
      const type = days === 0 ? 'EXPIRED' : 'EXPIRING';
      const title = `Document ${type}: ${doc.title}`;
      const body =
        days === 0
          ? `Your document "${doc.title}" (${doc.category.name}) has expired today. Please upload a new version.`
          : `Your document "${doc.title}" (${doc.category.name}) is expiring in ${days} day(s).`;

      // Notify the employee
      await createNotification({
        tenantId: doc.tenantId,
        userId: doc.employee.userId,
        type: 'document.expiry' as any,
        title,
        body,
        link: `/app/me/profile?tab=documents`,
      });

      // We could also notify HR here (find HR role users)
    }

    // Update status to EXPIRED for days === 0
    if (days === 0 && docs.length > 0) {
      await prisma.document.updateMany({
        where: {
          id: { in: docs.map((d: any) => d.id) },
        },
        data: {
          status: 'EXPIRED',
        },
      });
    }
  }

  logger.info('Finished document expiry check.');
}
