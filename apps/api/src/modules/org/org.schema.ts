import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    code: z.string().optional(),
    headId: z.string().optional(),
    parentId: z.string().optional(),
  }),
});

export const createLocationSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    timezone: z.string().default('Asia/Kolkata'),
    lat: z.number().optional(),
    lon: z.number().optional(),
    radius: z.number().default(200),
  }),
});

export const createDesignationSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    level: z.string().optional(),
  }),
});

export const createJobLevelSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    rank: z.number().optional(),
  }),
});

export const createHolidaySchema = z.object({
  body: z.object({
    name: z.string().min(2),
    date: z.string().datetime(),
    type: z.enum(['PUBLIC', 'OPTIONAL']).default('PUBLIC'),
    locationId: z.string().optional(),
  }),
});

export const updateCompanySettingsSchema = z.object({
  body: z.object({
    workingDays: z.array(z.number().min(0).max(6)).optional(),
    workHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    workHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    probationDays: z.number().min(0).optional(),
    timezone: z.string().optional(),
    isAttendanceEnabled: z.boolean().optional(),
    isGeolocationEnforced: z.boolean().optional(),
    clearanceMode: z.enum(['SIMPLE', 'CHECKLIST']).optional(),
    geminiApiKey: z.string().optional(),
  }),
});
