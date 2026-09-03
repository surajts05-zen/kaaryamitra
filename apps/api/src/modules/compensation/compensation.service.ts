import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { 
  createSalaryComponentSchema, 
  updateSalaryComponentSchema, 
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  reviseCompensationSchema
} from './compensation.schema.js';
import { z } from 'zod';

export const DEFAULT_INDIAN_COMPONENTS = [
  {
    name: 'Basic Pay',
    code: 'BASIC',
    type: 'EARNING',
    frequency: 'MONTHLY',
    isTaxable: true,
    isActive: true,
    description: 'Base salary component (typically 40-50% of CTC)'
  },
  {
    name: 'House Rent Allowance',
    code: 'HRA',
    type: 'EARNING',
    frequency: 'MONTHLY',
    isTaxable: true,
    isActive: true,
    description: 'Housing allowance (eligible for Section 10(13A) tax exemption)'
  },
  {
    name: 'Special Allowance',
    code: 'SPECIAL_ALLOWANCE',
    type: 'EARNING',
    frequency: 'MONTHLY',
    isTaxable: true,
    isActive: true,
    description: 'Flexible balancing allowance'
  },
  {
    name: 'Conveyance Allowance',
    code: 'CONVEYANCE',
    type: 'EARNING',
    frequency: 'MONTHLY',
    isTaxable: true,
    isActive: true,
    description: 'Travel / Commute allowance'
  },
  {
    name: 'Medical Allowance',
    code: 'MEDICAL',
    type: 'EARNING',
    frequency: 'MONTHLY',
    isTaxable: true,
    isActive: true,
    description: 'Medical expense reimbursement allowance'
  },
  {
    name: 'Leave Travel Allowance',
    code: 'LTA',
    type: 'EARNING',
    frequency: 'ANNUAL',
    isTaxable: true,
    isActive: true,
    description: 'Annual travel allowance (eligible for Section 10(5) exemption)'
  },
  {
    name: 'Performance Bonus',
    code: 'BONUS',
    type: 'EARNING',
    frequency: 'ANNUAL',
    isTaxable: true,
    isActive: true,
    description: 'Variable performance bonus payout'
  },
  {
    name: 'Employee Provident Fund (PF)',
    code: 'PF_EMP',
    type: 'EMPLOYEE_CONTRIBUTION',
    frequency: 'MONTHLY',
    isTaxable: false,
    isActive: true,
    description: 'Statutory 12% employee PF contribution (Section 80C deduction)'
  },
  {
    name: 'Professional Tax (PT)',
    code: 'PT',
    type: 'EMPLOYEE_CONTRIBUTION',
    frequency: 'MONTHLY',
    isTaxable: false,
    isActive: true,
    description: 'State professional tax deduction'
  },
  {
    name: 'Tax Deducted at Source (TDS)',
    code: 'TDS',
    type: 'DEDUCTION',
    frequency: 'MONTHLY',
    isTaxable: false,
    isActive: true,
    description: 'Monthly Income Tax deduction'
  },
  {
    name: 'Employer Provident Fund (PF)',
    code: 'PF_EMPR',
    type: 'EMPLOYER_CONTRIBUTION',
    frequency: 'MONTHLY',
    isTaxable: false,
    isActive: true,
    description: 'Statutory employer PF contribution'
  },
  {
    name: 'Employee State Insurance (ESI)',
    code: 'ESI_EMP',
    type: 'EMPLOYEE_CONTRIBUTION',
    frequency: 'MONTHLY',
    isTaxable: false,
    isActive: true,
    description: 'Employee ESI contribution'
  }
];

export class CompensationService {
  
  // ---------------------------------------------------------
  // SALARY COMPONENTS
  // ---------------------------------------------------------
  
  static async getComponents(tenantId: string) {
    return prisma.salaryComponent.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });
  }

  static async seedDefaultComponents(tenantId: string) {
    const results = [];
    for (const item of DEFAULT_INDIAN_COMPONENTS) {
      const existing = await prisma.salaryComponent.findFirst({
        where: { tenantId, code: item.code }
      });
      if (!existing) {
        const created = await prisma.salaryComponent.create({
          data: {
            tenantId,
            name: item.name,
            code: item.code,
            type: item.type as any,
            frequency: item.frequency as any,
            isTaxable: item.isTaxable,
            isActive: item.isActive,
            description: item.description
          }
        });
        results.push(created);
      }
    }
    return results;
  }

  static async createComponent(tenantId: string, data: z.infer<typeof createSalaryComponentSchema>) {
    const existing = await prisma.salaryComponent.findFirst({
      where: { tenantId, code: data.code }
    });
    if (existing) {
      throw AppError.conflict('Salary component with this code already exists');
    }
    return prisma.salaryComponent.create({
      data: {
        tenantId,
        name: data.name,
        code: data.code,
        type: data.type,
        frequency: data.frequency,
        isTaxable: data.isTaxable,
        isActive: data.isActive,
        description: data.description ?? null,
      }
    });
  }

  static async updateComponent(tenantId: string, id: string, data: z.infer<typeof updateSalaryComponentSchema>) {
    const component = await prisma.salaryComponent.findUnique({ where: { id } });
    if (!component || component.tenantId !== tenantId) {
      throw AppError.notFound('Salary component');
    }
    
    if (data.code && data.code !== component.code) {
      const existing = await prisma.salaryComponent.findFirst({
        where: { tenantId, code: data.code }
      });
      if (existing) throw AppError.conflict('Salary component code already in use');
    }

    return prisma.salaryComponent.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.frequency !== undefined && { frequency: data.frequency }),
        ...(data.isTaxable !== undefined && { isTaxable: data.isTaxable }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.description !== undefined && { description: data.description ?? null }),
      }
    });
  }

  // ---------------------------------------------------------
  // SALARY STRUCTURES
  // ---------------------------------------------------------

  static async getStructures(tenantId: string) {
    return prisma.salaryStructure.findMany({
      where: { tenantId },
      include: {
        items: {
          include: { component: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  static async createStructure(tenantId: string, data: z.infer<typeof createSalaryStructureSchema>) {
    return prisma.$transaction(async (tx) => {
      const structure = await tx.salaryStructure.create({
        data: {
          tenantId,
          name: data.name,
          description: data.description ?? null,
          isActive: data.isActive,
        }
      });

      if (data.items.length > 0) {
        await tx.salaryStructureItem.createMany({
          data: data.items.map(item => ({
            structureId: structure.id,
            componentId: item.componentId,
            calculationType: item.calculationType,
            value: item.value,
            percentageBase: item.percentageBase ?? null,
            formula: item.formula ?? null,
          }))
        });
      }

      return tx.salaryStructure.findUnique({
        where: { id: structure.id },
        include: { items: { include: { component: true } } }
      });
    });
  }

  static async updateStructure(tenantId: string, id: string, data: z.infer<typeof updateSalaryStructureSchema>) {
    const structure = await prisma.salaryStructure.findUnique({ where: { id } });
    if (!structure || structure.tenantId !== tenantId) throw AppError.notFound('Structure');

    return prisma.$transaction(async (tx) => {
      if (data.name || data.description !== undefined || data.isActive !== undefined) {
        await tx.salaryStructure.update({
          where: { id },
          data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description ?? null }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
          }
        });
      }

      if (data.items) {
        // Replace items
        await tx.salaryStructureItem.deleteMany({ where: { structureId: id } });
        await tx.salaryStructureItem.createMany({
          data: data.items.map(item => ({
            structureId: id,
            componentId: item.componentId,
            calculationType: item.calculationType,
            value: item.value,
            percentageBase: item.percentageBase ?? null,
            formula: item.formula ?? null,
          }))
        });
      }

      return tx.salaryStructure.findUnique({
        where: { id },
        include: { items: { include: { component: true } } }
      });
    });
  }

  // ---------------------------------------------------------
  // EMPLOYEE COMPENSATION
  // ---------------------------------------------------------

  static async getEmployeeCompensation(tenantId: string, employeeId: string) {
    const profile = await prisma.compensationProfile.findUnique({
      where: { employeeId },
      include: {
        structure: true,
        items: {
          include: { component: true }
        }
      }
    });
    
    if (profile && profile.tenantId !== tenantId) {
      throw AppError.notFound('Employee');
    }
    
    return profile;
  }

  static async reviseEmployeeCompensation(tenantId: string, employeeId: string, byUserId: string, data: z.infer<typeof reviseCompensationSchema>) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee || employee.tenantId !== tenantId) throw AppError.notFound('Employee');

    return prisma.$transaction(async (tx) => {
      // Create/Update profile
      const profile = await tx.compensationProfile.upsert({
        where: { employeeId },
        create: {
          tenantId,
          employeeId,
          structureId: data.structureId ?? null,
          effectiveFrom: new Date(data.effectiveFrom),
          annualCTC: data.annualCTC,
          monthlyGross: data.monthlyGross,
          bankName: data.bankName ?? null,
          accountNumber: data.accountNumber ?? null,
          routingNumber: data.routingNumber ?? null,
          accountType: data.accountType ?? null,
        },
        update: {
          structureId: data.structureId ?? null,
          effectiveFrom: new Date(data.effectiveFrom),
          annualCTC: data.annualCTC,
          monthlyGross: data.monthlyGross,
          bankName: data.bankName ?? null,
          accountNumber: data.accountNumber ?? null,
          routingNumber: data.routingNumber ?? null,
          accountType: data.accountType ?? null,
        }
      });

      // Update items
      await tx.compensationProfileItem.deleteMany({ where: { profileId: profile.id } });
      await tx.compensationProfileItem.createMany({
        data: data.items.map(i => ({
          profileId: profile.id,
          componentId: i.componentId,
          amount: i.amount
        }))
      });

      // Fetch previous profile history to get prev CTC
      const lastHistory = await tx.compensationHistory.findFirst({
        where: { employeeId, status: 'APPROVED' },
        orderBy: { effectiveDate: 'desc' }
      });

      // Add to history
      await tx.compensationHistory.create({
        data: {
          tenantId,
          employeeId,
          profileId: profile.id,
          effectiveDate: new Date(data.effectiveFrom),
          reason: data.reason ?? null,
          previousCTC: lastHistory?.newCTC ?? null,
          newCTC: data.annualCTC,
          status: 'APPROVED',
          approvedById: byUserId
        }
      });

      return tx.compensationProfile.findUnique({
        where: { id: profile.id },
        include: { items: { include: { component: true } } }
      });
    });
  }

  static async getEmployeeCompensationHistory(tenantId: string, employeeId: string) {
    return prisma.compensationHistory.findMany({
      where: { tenantId, employeeId },
      orderBy: { createdAt: 'desc' },
      include: {
        profile: {
          include: {
            items: { include: { component: true } },
            structure: true
          }
        }
      }
    });
  }

}
