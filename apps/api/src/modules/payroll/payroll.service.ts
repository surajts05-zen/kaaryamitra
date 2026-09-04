import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { createPayrollRunSchema, updatePayrollRunStatusSchema, createStatutoryRuleSchema, updateStatutoryRuleSchema } from './payroll.schema.js';
import { PayrollEngine } from './payroll.engine.js';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';

export class PayrollService {
  
  static async getRuns(tenantId: string) {
    return prisma.payrollRun.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { entries: true }
        }
      }
    });
  }

  static async getRunDetails(tenantId: string, runId: string) {
    const run = await prisma.payrollRun.findUnique({
      where: { id: runId },
      include: {
        entries: {
          include: {
            employee: {
              include: {
                compensationProfile: true
              }
            },
            lineItems: true
          }
        }
      }
    });

    if (!run || run.tenantId !== tenantId) {
      throw AppError.notFound('Payroll run');
    }
    return run;
  }

  static async createRun(tenantId: string, byUserId: string, data: z.infer<typeof createPayrollRunSchema>) {
    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);
    const periodStr = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;

    return prisma.$transaction(async (tx) => {
      // Create Run
      const run = await tx.payrollRun.create({
        data: {
          tenantId,
          name: data.name,
          period: periodStr,
          periodStart,
          periodEnd,
          paymentDate: new Date(data.paymentDate),
          frequency: data.frequency,
          status: 'DRAFT',
          processedAt: new Date(),
          approvedById: byUserId
        }
      });

      // Get eligible employees
      const activeEmployees = await tx.employee.findMany({
        where: { tenantId, employmentStatus: 'ACTIVE' },
        include: { compensationProfile: true }
      });

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;
      let totalEmployerContributions = 0;

      // Process each employee
      for (const emp of activeEmployees) {
        if (!emp.compensationProfile) continue;

        const calc = await PayrollEngine.calculateForEmployee(
          tenantId,
          emp.id,
          periodStart,
          periodEnd
        );

        if (!calc) continue;

        const entry = await tx.payrollEntry.create({
          data: {
            tenantId,
            payrollRunId: run.id,
            employeeId: emp.id,
            workingDays: calc.workingDays,
            lopDays: calc.lopDays,
            grossEarnings: calc.grossEarnings,
            totalDeductions: calc.grossDeductions,
            netPay: calc.netPay,
            employerContributions: calc.employerContributions
          }
        });

        if (calc.lineItems.length > 0) {
          await tx.payrollLineItem.createMany({
            data: calc.lineItems.map(li => ({
              entryId: entry.id,
              type: li.type,
              amount: li.amount,
              name: li.name,
              componentId: li.componentId || null
            }))
          });
        }

        totalGross += calc.grossEarnings;
        totalDeductions += calc.grossDeductions;
        totalNet += calc.netPay;
        totalEmployerContributions += calc.employerContributions;
      }

      // Update Run Totals
      return tx.payrollRun.update({
        where: { id: run.id },
        data: {
          totalGross,
          totalDeductions,
          totalNet,
          totalEmployerContributions
        }
      });
    });
  }

  static async updateRunStatus(tenantId: string, runId: string, data: z.infer<typeof updatePayrollRunStatusSchema>) {
    const run = await prisma.payrollRun.findUnique({ where: { id: runId } });
    if (!run || run.tenantId !== tenantId) throw AppError.notFound('Payroll run');

    if (run.status === 'PAID') {
      throw AppError.badRequest('Cannot update status of a PAID payroll run');
    }

    const updateData: any = {
      status: data.status,
    };

    if (data.status === 'APPROVED') {
      updateData.approvedAt = new Date();
    } else if (data.status === 'FINALIZED') {
      updateData.finalizedAt = new Date();
    } else if (data.status === 'PAID') {
      updateData.paidAt = new Date();
    }

    return prisma.payrollRun.update({
      where: { id: runId },
      data: updateData
    });
  }

  // ---------------------------------------------------------
  // PAYSLIP GENERATION (Phase 30)
  // ---------------------------------------------------------
  
  static async getEmployeePayslips(tenantId: string, employeeId: string) {
    return prisma.payrollEntry.findMany({
      where: { 
        tenantId, 
        employeeId, 
        payrollRun: { status: { in: ['FINALIZED', 'PAID'] } } 
      },
      include: { payrollRun: true },
      orderBy: { payrollRun: { createdAt: 'desc' } }
    });
  }

  static async getEmployeePayslipDetails(tenantId: string, employeeId: string, entryId: string) {
    const entry = await prisma.payrollEntry.findUnique({
      where: { id: entryId },
      include: {
        payrollRun: true,
        lineItems: true,
        employee: {
          include: { department: true, designation: true, compensationProfile: true }
        }
      }
    });

    if (!entry || entry.tenantId !== tenantId || entry.employeeId !== employeeId) {
      throw AppError.notFound('Payslip');
    }

    return entry;
  }

  // ---------------------------------------------------------
  // STATUTORY RULES (Phase 31)
  // ---------------------------------------------------------

  static async getStatutoryRules(tenantId: string) {
    return prisma.statutoryRule.findMany({
      where: { tenantId },
      orderBy: { countryCode: 'asc' }
    });
  }

  static async createStatutoryRule(tenantId: string, data: z.infer<typeof createStatutoryRuleSchema>) {
    return prisma.statutoryRule.create({
      data: {
        tenantId,
        countryCode: data.countryCode,
        name: data.name,
        code: data.code,
        type: data.type,
        baseComponent: data.baseComponent ?? null,
        rateOrAmount: data.rateOrAmount,
        cappedAt: data.cappedAt ?? null,
        effectiveFrom: new Date(data.effectiveFrom),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        isActive: data.isActive
      }
    });
  }

  static async updateStatutoryRule(tenantId: string, id: string, data: z.infer<typeof updateStatutoryRuleSchema>) {
    const rule = await prisma.statutoryRule.findUnique({ where: { id } });
    if (!rule || rule.tenantId !== tenantId) {
      throw AppError.notFound('Statutory rule');
    }
    return prisma.statutoryRule.update({
      where: { id },
      data: {
        ...(data.countryCode !== undefined && { countryCode: data.countryCode }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.baseComponent !== undefined && { baseComponent: data.baseComponent ?? null }),
        ...(data.rateOrAmount !== undefined && { rateOrAmount: data.rateOrAmount }),
        ...(data.cappedAt !== undefined && { cappedAt: data.cappedAt ?? null }),
        ...(data.effectiveFrom !== undefined && { effectiveFrom: new Date(data.effectiveFrom) }),
        ...(data.effectiveTo !== undefined && { effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      }
    });
  }
  // ---------------------------------------------------------
  // CSV UPLOAD
  // ---------------------------------------------------------
  
  static async uploadCsvForRun(tenantId: string, runId: string, fileBuffer: Buffer) {
    const run = await prisma.payrollRun.findUnique({ where: { id: runId } });
    if (!run || run.tenantId !== tenantId) {
      throw AppError.notFound('Payroll run');
    }

    if (run.status !== 'DRAFT') {
      throw AppError.badRequest('Can only upload CSV to DRAFT payroll runs');
    }

    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as Record<string, string>[];

    const skipped: { email: string, reason: string }[] = [];
    const successful: string[] = [];

    // Fetch all active employees in this tenant to match emails
    const employees = await prisma.employee.findMany({
      where: { tenantId }
    });
    const emailToEmployee = new Map(employees.map(emp => [emp.workEmail.toLowerCase(), emp]));

    let totalGross = Number(run.totalGross || 0);
    let totalDeductions = Number(run.totalDeductions || 0);
    let totalNet = Number(run.totalNet || 0);
    
    // Process each record
    for (const record of records) {
      const email = record['EmployeeEmail'] || record['Email'] || record['Employee Email'];
      if (!email) {
        skipped.push({ email: 'Unknown', reason: 'Missing email column' });
        continue;
      }
      
      const emp = emailToEmployee.get(email.toLowerCase());
      if (!emp) {
        skipped.push({ email, reason: 'Employee not found in system' });
        continue;
      }

      const existingEntry = await prisma.payrollEntry.findUnique({
        where: { payrollRunId_employeeId: { payrollRunId: run.id, employeeId: emp.id } }
      });

      if (existingEntry) {
        skipped.push({ email, reason: 'Employee already has an entry in this payroll run' });
        continue;
      }

      const workingDays = parseFloat(record['WorkingDays'] || record['Working Days'] || '0');
      const grossEarnings = parseFloat(record['GrossEarnings'] || record['Gross Earnings'] || record['Total Earnings'] || '0');
      const totalDeds = parseFloat(record['TotalDeductions'] || record['Total Deductions'] || '0');
      const netPay = parseFloat(record['NetPay'] || record['Net Pay'] || '0');

      // Add to running totals
      totalGross += grossEarnings;
      totalDeductions += totalDeds;
      totalNet += netPay;

      await prisma.$transaction(async (tx) => {
        const entry = await tx.payrollEntry.create({
          data: {
            tenantId,
            payrollRunId: run.id,
            employeeId: emp.id,
            workingDays,
            lopDays: 0,
            grossEarnings,
            totalDeductions: totalDeds,
            netPay,
            employerContributions: 0,
          }
        });

        const fixedCols = ['EmployeeEmail', 'Email', 'Employee Email', 'WorkingDays', 'Working Days', 'GrossEarnings', 'Gross Earnings', 'Total Earnings', 'TotalDeductions', 'Total Deductions', 'NetPay', 'Net Pay'];
        
        const lineItems = [];
        for (const [key, value] of Object.entries(record)) {
          if (fixedCols.includes(key)) continue;
          
          const amount = parseFloat(value as string);
          if (isNaN(amount) || amount === 0) continue;

          lineItems.push({
            entryId: entry.id,
            type: amount < 0 ? 'DEDUCTION' : 'EARNING',
            name: key,
            amount: Math.abs(amount)
          });
        }

        if (lineItems.length > 0) {
          await tx.payrollLineItem.createMany({
            data: lineItems as any
          });
        }
      });

      successful.push(email);
    }

    await prisma.payrollRun.update({
      where: { id: run.id },
      data: {
        totalGross,
        totalDeductions,
        totalNet
      }
    });

    return {
      message: `Processed CSV. ${successful.length} successful, ${skipped.length} skipped.`,
      successful: successful.length,
      skipped
    };
  }
}
