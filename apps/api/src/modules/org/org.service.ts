import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import type { z } from 'zod';
import type {
  createDepartmentSchema,
  createLocationSchema,
  createDesignationSchema,
  createJobLevelSchema,
  createHolidaySchema,
  updateCompanySettingsSchema,
} from './org.schema.js';

export class OrgService {
  // ── Departments ────────────────────────────────────────────────────────────
  
  static async listDepartments(tenantId: string) {
    return prisma.department.findMany({
      where: { tenantId },
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createDepartment(tenantId: string, data: z.infer<typeof createDepartmentSchema>['body']) {
    return prisma.department.create({
      data: {
        tenantId,
        name: data.name,
        code: data.code ?? null,
        headId: data.headId ?? null,
        parentId: data.parentId ?? null,
      },
    });
  }

  // ── Locations ──────────────────────────────────────────────────────────────

  static async listLocations(tenantId: string) {
    return prisma.location.findMany({
      where: { tenantId },
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createLocation(tenantId: string, data: z.infer<typeof createLocationSchema>['body']) {
    return prisma.location.create({
      data: {
        tenantId,
        name: data.name,
        address: data.address ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        country: data.country ?? null,
        timezone: data.timezone,
        lat: data.lat ?? null,
        lon: data.lon ?? null,
        radius: data.radius,
      },
    });
  }

  // ── Roles & Designations ───────────────────────────────────────────────────

  static async listDesignations(tenantId: string) {
    return prisma.designation.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  static async createDesignation(tenantId: string, data: z.infer<typeof createDesignationSchema>['body']) {
    return prisma.designation.create({
      data: {
        tenantId,
        name: data.name,
        level: data.level ?? null,
      },
    });
  }

  static async listJobLevels(tenantId: string) {
    return prisma.jobLevel.findMany({
      where: { tenantId },
      orderBy: { rank: 'asc' },
    });
  }

  static async createJobLevel(tenantId: string, data: z.infer<typeof createJobLevelSchema>['body']) {
    return prisma.jobLevel.create({
      data: {
        tenantId,
        name: data.name,
        rank: data.rank ?? null,
      },
    });
  }

  // ── Company Settings & Holidays ────────────────────────────────────────────

  static async getCompanySettings(tenantId: string) {
    let settings = await prisma.companySettings.findUnique({ where: { tenantId } });
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: { tenantId },
      });
    }
    return settings;
  }

  static async updateCompanySettings(tenantId: string, data: z.infer<typeof updateCompanySettingsSchema>['body']) {
    const updateData: any = { ...data };
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    return prisma.companySettings.upsert({
      where: { tenantId },
      update: updateData,
      create: {
        tenantId,
        workingDays: data.workingDays ?? [1, 2, 3, 4, 5],
        workHoursStart: data.workHoursStart ?? '09:00',
        workHoursEnd: data.workHoursEnd ?? '18:00',
        probationDays: data.probationDays ?? 90,
        timezone: data.timezone ?? 'Asia/Kolkata',
      },
    });
  }

  static async listHolidays(tenantId: string) {
    return prisma.holiday.findMany({
      where: { tenantId },
      orderBy: { date: 'asc' },
      include: { location: true },
    });
  }

  static async createHoliday(tenantId: string, data: z.infer<typeof createHolidaySchema>['body']) {
    return prisma.holiday.create({
      data: {
        tenantId,
        name: data.name,
        date: new Date(data.date),
        type: data.type,
        locationId: data.locationId || null,
      },
    });
  }
}
