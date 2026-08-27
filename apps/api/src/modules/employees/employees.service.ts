import { prisma } from '../../lib/prisma.js';
import type { Prisma } from '@prisma/client';
import { UserStatus } from '@prisma/client';

export class EmployeesService {
  static async listEmployees(tenantId: string) {
    return prisma.employee.findMany({
      where: { tenantId },
      include: {
        department: true,
        designation: true,
        location: true,
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getEmployee(tenantId: string, employeeId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId, tenantId },
      include: {
        department: true,
        designation: true,
        location: true,
        team: true,
        jobLevel: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        user: {
          select: { email: true, status: true, lastLoginAt: true },
        },
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    return employee;
  }

  static async createEmployee(tenantId: string, data: any) {
    const {
      firstName,
      lastName,
      workEmail,
      dateOfBirth,
      joiningDate,
      confirmationDate,
      probationEndDate,
      ...rest
    } = data;

    // Convert empty strings to null to avoid foreign key constraints failing
    Object.keys(rest).forEach(key => {
      if (rest[key] === '') rest[key] = null;
    });

    // Ensure user exists for this email
    let user = await prisma.user.findUnique({
      where: { email: workEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: workEmail,
          firstName,
          lastName,
          tenantId,
          status: UserStatus.PENDING_SETUP,
        },
      });
    }

    // Check if employee already exists for this user in this tenant
    const existingEmployee = await prisma.employee.findFirst({
      where: { userId: user.id, tenantId },
    });

    if (existingEmployee) {
      throw new Error('An employee record already exists for this email.');
    }

    // Create Employee record
    return prisma.employee.create({
      data: {
        tenantId,
        userId: user.id,
        firstName,
        lastName,
        workEmail,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        joiningDate: new Date(joiningDate),
        confirmationDate: confirmationDate ? new Date(confirmationDate) : undefined,
        probationEndDate: probationEndDate ? new Date(probationEndDate) : undefined,
        ...rest,
      },
    });
  }

  static async updateEmployee(tenantId: string, employeeId: string, data: any) {
    const {
      dateOfBirth,
      joiningDate,
      confirmationDate,
      probationEndDate,
      ...rest
    } = data;

    const updateData: any = { ...rest };
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '') {
        updateData[key] = null;
      }
    });
    
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (joiningDate !== undefined) updateData.joiningDate = new Date(joiningDate);
    if (confirmationDate !== undefined) updateData.confirmationDate = confirmationDate ? new Date(confirmationDate) : null;
    if (probationEndDate !== undefined) updateData.probationEndDate = probationEndDate ? new Date(probationEndDate) : null;

    if (updateData.workEmail) {
      const currentEmp = await prisma.employee.findUnique({
        where: { id: employeeId, tenantId },
        select: { userId: true, workEmail: true },
      });
      if (currentEmp?.userId && currentEmp.workEmail !== updateData.workEmail) {
        await prisma.user.update({
          where: { id: currentEmp.userId },
          data: { email: updateData.workEmail },
        });
      }
    }

    return prisma.employee.update({
      where: { id: employeeId, tenantId },
      data: updateData,
    });
  }
}
