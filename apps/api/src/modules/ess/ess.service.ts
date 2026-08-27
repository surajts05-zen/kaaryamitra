import { prisma } from '../../lib/prisma.js';

export class EssService {
  static async getMyProfile(tenantId: string, userId: string) {
    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: {
        department: true,
        designation: true,
        location: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, workEmail: true, avatarUrl: true },
        },
      },
    });

    if (!employee || employee.tenantId !== tenantId) {
      throw new Error('Employee profile not found');
    }

    return employee;
  }

  static async updateMyProfile(tenantId: string, userId: string, data: any) {
    const employee = await prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee || employee.tenantId !== tenantId) {
      throw new Error('Employee profile not found');
    }

    return prisma.employee.update({
      where: { id: employee.id },
      data: {
        personalEmail: data.personalEmail ?? null,
        phone: data.phone ?? null,
      },
    });
  }
}
