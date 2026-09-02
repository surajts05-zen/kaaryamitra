import { prisma } from '../../lib/prisma.js';

export class DashboardService {
  static async getDashboardStats(tenantId: string) {
    const [
      headcount,
      departments,
      locations,
      openRoles,
      upcomingHolidays,
      recentActivity
    ] = await Promise.all([
      prisma.employee.count({
        where: { tenantId, employmentStatus: { not: 'OFFBOARDED' } }
      }),
      prisma.department.count({
        where: { tenantId }
      }),
      prisma.location.count({
        where: { tenantId }
      }),
      prisma.designation.count({
        where: { tenantId }
      }),
      prisma.holiday.findMany({
        where: {
          tenantId,
          date: { gte: new Date() }
        },
        orderBy: { date: 'asc' },
        take: 5
      }),
      prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          action: true,
          actorEmail: true,
          createdAt: true,
        }
      })
    ]);

    return {
      headcount,
      departments,
      locations,
      openRoles,
      upcomingHolidays,
      recentActivity
    };
  }
}
