import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export class MeetingTypesService {
  static async list(tenantId: string) {
    return prisma.meetingType.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });
  }

  static async create(tenantId: string, data: any) {
    return prisma.meetingType.create({
      data: { ...data, tenantId }
    });
  }

  static async update(tenantId: string, id: string, data: any) {
    const mt = await prisma.meetingType.findFirst({ where: { id, tenantId } });
    if (!mt) throw AppError.notFound('Meeting type not found');

    return prisma.meetingType.update({
      where: { id },
      data
    });
  }
}
