import { prisma } from '../../lib/prisma.js';

export class DashboardService {
  static async getDashboardStats(tenantId: string) {
    const now = new Date();
    const currentYear = now.getFullYear();

    // 1. Fetch count stats
    const [headcount, departments, locations, openRoles] = await Promise.all([
      prisma.employee.count({
        where: { tenantId, employmentStatus: { not: 'OFFBOARDED' } },
      }),
      prisma.department.count({ where: { tenantId } }),
      prisma.location.count({ where: { tenantId } }),
      prisma.designation.count({ where: { tenantId } }),
    ]);

    // 2. Fetch upcoming holidays for this tenant
    let upcomingHolidays = await prisma.holiday.findMany({
      where: {
        tenantId,
        date: { gte: now },
      },
      orderBy: { date: 'asc' },
      take: 5,
    });

    // If no upcoming holidays exist, auto-seed standard upcoming company holidays for the workspace
    if (upcomingHolidays.length === 0) {
      const existingCount = await prisma.holiday.count({ where: { tenantId } });
      if (existingCount === 0) {
        const defaultHolidays = [
          { name: "New Year's Day", date: new Date(currentYear, 0, 1), type: 'PUBLIC' },
          { name: 'Republic Day', date: new Date(currentYear, 0, 26), type: 'PUBLIC' },
          { name: 'Labor Day', date: new Date(currentYear, 4, 1), type: 'PUBLIC' },
          { name: 'Independence Day', date: new Date(currentYear, 7, 15), type: 'PUBLIC' },
          { name: 'Gandhi Jayanti', date: new Date(currentYear, 9, 2), type: 'PUBLIC' },
          { name: 'Diwali / Festival of Lights', date: new Date(currentYear, 10, 1), type: 'PUBLIC' },
          { name: 'Christmas Day', date: new Date(currentYear, 11, 25), type: 'PUBLIC' },
          { name: "New Year's Day", date: new Date(currentYear + 1, 0, 1), type: 'PUBLIC' },
          { name: 'Republic Day', date: new Date(currentYear + 1, 0, 26), type: 'PUBLIC' },
        ];

        await prisma.holiday.createMany({
          data: defaultHolidays.map((h) => ({
            tenantId,
            name: h.name,
            date: h.date,
            type: h.type,
          })),
        });

        upcomingHolidays = await prisma.holiday.findMany({
          where: {
            tenantId,
            date: { gte: now },
          },
          orderBy: { date: 'asc' },
          take: 5,
        });
      } else {
        // Fallback to most recent holidays if all stored holidays are in the past
        upcomingHolidays = await prisma.holiday.findMany({
          where: { tenantId },
          orderBy: { date: 'desc' },
          take: 5,
        });
      }
    }

    // 3. Build dynamic real-time recent activity feed across all workspace modules
    const [auditLogs, recentEmployees, recentLeaves, recentTickets, recentResignations] =
      await Promise.all([
        prisma.auditLog.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, action: true, actorEmail: true, createdAt: true },
        }),
        prisma.employee.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, firstName: true, lastName: true, workEmail: true, createdAt: true },
        }),
        prisma.leaveApplication.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            employee: { select: { firstName: true, lastName: true, workEmail: true } },
            leaveType: { select: { name: true } },
          },
        }),
        prisma.helpdeskTicket.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            employee: { select: { firstName: true, lastName: true, workEmail: true } },
            category: { select: { name: true } },
          },
        }),
        prisma.resignation.findMany({
          where: { tenantId },
          orderBy: { submittedAt: 'desc' },
          take: 5,
          include: {
            employee: { select: { firstName: true, lastName: true, workEmail: true } },
          },
        }),
      ]);

    const activityFeed: { id: string; action: string; actorEmail: string; createdAt: Date }[] = [];

    auditLogs.forEach((log) => {
      activityFeed.push({
        id: log.id,
        action: log.action,
        actorEmail: log.actorEmail,
        createdAt: log.createdAt,
      });
    });

    recentEmployees.forEach((emp) => {
      activityFeed.push({
        id: `emp-${emp.id}`,
        action: `Employee onboarded: ${emp.firstName} ${emp.lastName}`,
        actorEmail: emp.workEmail,
        createdAt: emp.createdAt,
      });
    });

    recentLeaves.forEach((l) => {
      activityFeed.push({
        id: `leave-${l.id}`,
        action: `Leave applied (${l.leaveType?.name ?? 'Leave'}): ${l.employee.firstName} ${l.employee.lastName}`,
        actorEmail: l.employee.workEmail,
        createdAt: l.createdAt,
      });
    });

    recentTickets.forEach((t) => {
      activityFeed.push({
        id: `ticket-${t.id}`,
        action: `Helpdesk ticket (${t.category?.name ?? 'Support'}): ${t.title}`,
        actorEmail: t.employee.workEmail,
        createdAt: t.createdAt,
      });
    });

    recentResignations.forEach((r) => {
      activityFeed.push({
        id: `resignation-${r.id}`,
        action: `Resignation submitted: ${r.employee.firstName} ${r.employee.lastName}`,
        actorEmail: r.employee.workEmail,
        createdAt: r.submittedAt,
      });
    });

    activityFeed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentActivity = activityFeed.slice(0, 5);

    return {
      headcount,
      departments,
      locations,
      openRoles,
      upcomingHolidays,
      recentActivity,
    };
  }
}
