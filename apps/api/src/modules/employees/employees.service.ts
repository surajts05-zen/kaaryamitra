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
      roleId,
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

    let employee;
    const parsedDob = dateOfBirth && !isNaN(new Date(dateOfBirth).getTime()) ? new Date(dateOfBirth) : undefined;
    const parsedJoining = joiningDate && !isNaN(new Date(joiningDate).getTime()) ? new Date(joiningDate) : undefined;
    const parsedConfirm = confirmationDate && !isNaN(new Date(confirmationDate).getTime()) ? new Date(confirmationDate) : undefined;
    const parsedProbation = probationEndDate && !isNaN(new Date(probationEndDate).getTime()) ? new Date(probationEndDate) : undefined;

    if (existingEmployee) {
      employee = await prisma.employee.update({
        where: { id: existingEmployee.id },
        data: {
          firstName,
          lastName,
          ...(parsedDob ? { dateOfBirth: parsedDob } : {}),
          ...(parsedJoining ? { joiningDate: parsedJoining } : {}),
          ...(parsedConfirm ? { confirmationDate: parsedConfirm } : {}),
          ...(parsedProbation ? { probationEndDate: parsedProbation } : {}),
          ...rest,
        },
      });
    } else {
      employee = await prisma.employee.create({
        data: {
          tenantId,
          userId: user.id,
          firstName,
          lastName,
          workEmail,
          dateOfBirth: parsedDob,
          joiningDate: parsedJoining || new Date(),
          confirmationDate: parsedConfirm,
          probationEndDate: parsedProbation,
          ...rest,
        },
      });
    }

    if (roleId) {
      try {
        await prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId,
            },
          },
          create: {
            userId: user.id,
            roleId,
          },
          update: {},
        });
      } catch (err) {
        console.error(`Failed to assign role ${roleId} to user ${user.id}:`, err);
      }
    }

    // Automatically assign active policies that require acknowledgement
    try {
      const activePolicies = await prisma.policy.findMany({
        where: { tenantId, isPublished: true, requiresAck: true },
        include: { versions: { where: { status: 'PUBLISHED' }, take: 1 } }
      });

      const acksToCreate = activePolicies
        .filter(p => p.versions.length > 0)
        .map(p => ({
          tenantId,
          policyVersionId: p.versions[0]!.id,
          employeeId: employee.id,
          status: 'PENDING'
        }));

      if (acksToCreate.length > 0) {
        await prisma.policyAcknowledgement.createMany({
          data: acksToCreate,
          skipDuplicates: true
        });
      }
    } catch (err) {
      console.error(`Failed to assign policies to new employee ${employee.id}:`, err);
    }

    return employee;

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

  static async bulkCreateEmployees(
    tenantId: string,
    items: Array<{
      firstName: string;
      lastName: string;
      workEmail: string;
      employeeCode?: string;
      joiningDate?: string;
      role?: string;
      roleId?: string;
      managerEmail?: string;
      managerCode?: string;
      manager?: string;
    }>
  ) {
    // 1. Pre-fetch tenant roles to map role names to role IDs
    const tenantRoles = await prisma.role.findMany({ where: { tenantId } });
    const roleMap = new Map<string, string>();
    tenantRoles.forEach((r) => roleMap.set(r.name.toLowerCase(), r.id));

    // 2. Pre-fetch existing tenant employees for manager lookup
    const existingEmployees = await prisma.employee.findMany({
      where: { tenantId },
      select: { id: true, workEmail: true, employeeCode: true, firstName: true, lastName: true },
    });

    const empLookupMap = new Map<string, string>();
    existingEmployees.forEach((e) => {
      if (e.workEmail) empLookupMap.set(e.workEmail.toLowerCase(), e.id);
      if (e.employeeCode) empLookupMap.set(e.employeeCode.trim().toLowerCase(), e.id);
      const fullName = `${e.firstName} ${e.lastName}`.trim().toLowerCase();
      if (fullName) empLookupMap.set(fullName, e.id);
    });

    const created: any[] = [];
    const createdBatch: { emp: any; item: any }[] = [];

    // Pass 1: Create Employee and User accounts & assign Roles
    for (const item of items) {
      if (!item.firstName || !item.lastName || !item.workEmail) continue;
      try {
        const cleanEmail = item.workEmail.toLowerCase().trim();
        let targetRoleId = item.roleId;

        if (!targetRoleId && item.role) {
          const cleanRoleName = item.role.trim().toLowerCase();
          targetRoleId = roleMap.get(cleanRoleName);
        }

        const emp = await this.createEmployee(tenantId, {
          firstName: item.firstName.trim(),
          lastName: item.lastName.trim(),
          workEmail: cleanEmail,
          employeeCode: item.employeeCode ? item.employeeCode.trim() : undefined,
          joiningDate: item.joiningDate ? item.joiningDate : new Date().toISOString(),
          roleId: targetRoleId || undefined,
        });

        created.push(emp);
        createdBatch.push({ emp, item });

        // Update lookup map with newly created employee
        empLookupMap.set(cleanEmail, emp.id);
        if (emp.employeeCode) {
          empLookupMap.set(emp.employeeCode.trim().toLowerCase(), emp.id);
        }
        const fullName = `${emp.firstName} ${emp.lastName}`.trim().toLowerCase();
        if (fullName) empLookupMap.set(fullName, emp.id);
      } catch (err) {
        console.error(`Failed to bulk create employee ${item.workEmail}:`, err);
      }
    }

    // Pass 2: Connect Manager relationships
    for (const { emp, item } of createdBatch) {
      const managerRef = (item.managerEmail || item.managerCode || item.manager || '').trim().toLowerCase();
      if (!managerRef) continue;

      const managerId = empLookupMap.get(managerRef);
      if (managerId && managerId !== emp.id) {
        try {
          await prisma.employee.update({
            where: { id: emp.id },
            data: { managerId },
          });
        } catch (err) {
          console.error(`Failed to assign manager ${managerRef} to employee ${emp.workEmail}:`, err);
        }
      }
    }

    return created;
  }
}
