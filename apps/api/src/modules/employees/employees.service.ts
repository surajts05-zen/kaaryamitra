import { prisma } from '../../lib/prisma.js';
import type { Prisma } from '@prisma/client';
import { UserStatus } from '@prisma/client';

export class EmployeesService {
  static async listEmployees(tenantId: string) {
    const employees = await prisma.employee.findMany({
      where: { tenantId },
      include: {
        department: true,
        designation: true,
        location: true,
        user: { select: { id: true, email: true } },
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also include tenant users who don't have an explicit Employee record yet (e.g. Tenant Admin)
    const employeeUserIds = employees.map((e) => e.userId);
    const nonEmployeeUsers = await prisma.user.findMany({
      where: {
        tenantId,
        id: { notIn: employeeUserIds },
      },
    });

    const adminVirtualEmployees = nonEmployeeUsers.map((u) => ({
      id: u.id,
      tenantId,
      userId: u.id,
      employeeCode: 'ADMIN',
      firstName: u.firstName,
      lastName: u.lastName,
      workEmail: u.email,
      joiningDate: u.createdAt,
      user: { id: u.id, email: u.email },
      department: null,
      designation: { id: 'admin', name: 'Tenant Admin', tenantId, level: 'Executive' },
      location: null,
      manager: null,
    }));

    return [...employees, ...adminVirtualEmployees];
  }

  static async getEmployee(tenantId: string, employeeId: string) {
    const employee = await prisma.employee.findFirst({
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
      // Check if this is a non-employee Tenant Admin user
      const user = await prisma.user.findFirst({
        where: { id: employeeId, tenantId },
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
          joiningDate: user.createdAt,
          user: { email: user.email, status: user.status, lastLoginAt: user.lastLoginAt },
          department: null,
          designation: { id: 'admin', name: 'Tenant Admin', tenantId, level: 'Executive' },
          location: null,
          manager: null,
          employmentType: 'FULL_TIME',
          employmentStatus: 'ACTIVE',
        };
      }

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
      if (rest[key] === '' || rest[key] === 'none') rest[key] = null;
    });

    // Ensure user exists for this email
    let user = await prisma.user.findUnique({
      where: { email: workEmail },
    });

    if (!user) {
      const { hashPassword } = await import('../../lib/auth.js');
      const defaultPasswordHash = await hashPassword('Password@123');

      user = await prisma.user.create({
        data: {
          email: workEmail,
          firstName,
          lastName,
          tenantId,
          passwordHash: defaultPasswordHash,
          status: UserStatus.ACTIVE,
        },
      });
    } else if (!user.tenantId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { tenantId },
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
      firstName,
      lastName,
      workEmail,
      ...rest
    } = data;

    const updateData: any = { ...rest };
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (workEmail !== undefined) updateData.workEmail = workEmail;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === 'none') {
        updateData[key] = null;
      }
    });
    
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (joiningDate !== undefined) updateData.joiningDate = new Date(joiningDate);
    if (confirmationDate !== undefined) updateData.confirmationDate = confirmationDate ? new Date(confirmationDate) : null;
    if (probationEndDate !== undefined) updateData.probationEndDate = probationEndDate ? new Date(probationEndDate) : null;

    let existingEmp = await prisma.employee.findFirst({
      where: { OR: [{ id: employeeId }, { userId: employeeId }], tenantId },
    });

    if (!existingEmp) {
      // Check if user exists (e.g. Tenant Admin without an employee record yet)
      const user = await prisma.user.findFirst({
        where: { id: employeeId, tenantId },
      });

      if (user) {
        // Instantiate official Employee record for this user
        existingEmp = await prisma.employee.create({
          data: {
            tenantId,
            userId: user.id,
            firstName: firstName ?? user.firstName,
            lastName: lastName ?? user.lastName,
            workEmail: workEmail ?? user.email,
            joiningDate: joiningDate ? new Date(joiningDate) : user.createdAt,
            ...updateData,
          },
        });

        if (firstName || lastName || workEmail) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              ...(firstName && { firstName }),
              ...(lastName && { lastName }),
              ...(workEmail && { email: workEmail }),
            },
          });
        }

        return existingEmp;
      }

      throw new Error('Employee record not found');
    }

    if (existingEmp.userId && (firstName || lastName || workEmail)) {
      await prisma.user.update({
        where: { id: existingEmp.userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(workEmail && { email: workEmail }),
        },
      });
    }

    return prisma.employee.update({
      where: { id: existingEmp.id },
      data: updateData,
    });
  }
}
