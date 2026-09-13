import { prisma } from '../../lib/prisma.js';

export class EssService {
  static async getMyProfile(tenantId: string, userId: string) {
    let employee = await prisma.employee.findUnique({
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

    if (!employee) {
      const user = await prisma.user.findFirst({
        where: { id: userId, tenantId },
      });

      if (user) {
        return {
          id: user.id,
          tenantId,
          userId: user.id,
          employeeCode: 'ADMIN',
          firstName: user.firstName,
          lastName: user.lastName,
          workEmail: user.email,
          personalEmail: null,
          phone: null,
          avatarUrl: null,
          joiningDate: user.createdAt,
          department: null,
          designation: { id: 'admin', name: 'Tenant Admin', tenantId, level: 'Executive' },
          location: null,
          manager: null,
          employmentType: 'FULL_TIME',
          employmentStatus: 'ACTIVE',
        };
      }

      throw new Error('Employee profile not found');
    }

    if (employee.tenantId !== tenantId) {
      throw new Error('Employee profile not found');
    }

    return employee;
  }

  static async updateMyProfile(tenantId: string, userId: string, data: any) {
    let employee = await prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      const user = await prisma.user.findFirst({
        where: { id: userId, tenantId },
      });

      if (user) {
        employee = await prisma.employee.create({
          data: {
            tenantId,
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            workEmail: user.email,
            joiningDate: user.createdAt,
            personalEmail: data.personalEmail || null,
            phone: data.phone || null,
            avatarUrl: data.avatarUrl || null,
          },
        });
        return employee;
      }

      throw new Error('Employee profile not found');
    }

    if (employee.tenantId !== tenantId) {
      throw new Error('Employee profile not found');
    }

    return prisma.employee.update({
      where: { id: employee.id },
      data: {
        ...(data.personalEmail !== undefined && { personalEmail: data.personalEmail || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl || null }),
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
      },
    });
  }
}
