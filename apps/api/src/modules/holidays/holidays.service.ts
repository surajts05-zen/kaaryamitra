import { prisma } from '../../lib/prisma.js';
import { z } from 'zod';

export const createHolidaySchema = z.object({
  name: z.string().min(2),
  date: z.string().datetime().or(z.date()).or(z.string()),
  type: z.enum(['PUBLIC', 'OPTIONAL']),
  locationId: z.string().optional().nullable(),
});

export const updateHolidaySchema = createHolidaySchema.partial();

export class HolidaysService {
  static async listHolidays(tenantId: string) {
    return prisma.holiday.findMany({
      where: { tenantId },
      orderBy: { date: 'asc' },
    });
  }

  static async createHoliday(tenantId: string, data: z.infer<typeof createHolidaySchema>) {
    return prisma.holiday.create({
      data: {
        tenantId,
        name: data.name,
        date: new Date(data.date),
        type: data.type,
        locationId: data.locationId ?? null,
      },
    });
  }

  static async updateHoliday(tenantId: string, id: string, data: z.infer<typeof updateHolidaySchema>) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.locationId !== undefined) updateData.locationId = data.locationId ?? null;
    if (data.date !== undefined && data.date) updateData.date = new Date(data.date);

    return prisma.holiday.update({
      where: { id, tenantId },
      data: updateData,
    });
  }

  static async deleteHoliday(tenantId: string, id: string) {
    return prisma.holiday.delete({
      where: { id, tenantId },
    });
  }
}
