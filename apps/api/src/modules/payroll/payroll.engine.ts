import { prisma } from '../../lib/prisma.js';

export class PayrollEngine {
  
  static async calculateForEmployee(
    tenantId: string, 
    employeeId: string, 
    periodStart: Date, 
    periodEnd: Date
  ) {
    // 1. Get Employee Compensation Profile
    const profile = await prisma.compensationProfile.findUnique({
      where: { employeeId },
      include: {
        items: {
          include: { component: true }
        }
      }
    });

    if (!profile) return null;
    if (profile.tenantId !== tenantId) return null;

    // TODO: Factor in LOP (Loss of Pay) from Attendance/Leave modules
    // For MVP Phase 29, we assume full attendance
    const daysInPeriod = Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const lopDays = 0;
    const workingDays = daysInPeriod - lopDays;
    const prorationFactor = workingDays / (daysInPeriod || 30);

    const lineItems: any[] = [];
    let grossEarnings = 0;
    let grossDeductions = 0;
    let employerContributions = 0;

    // 2. Process Components
    for (const item of profile.items) {
      const amount = Number(item.amount) * prorationFactor;

      lineItems.push({
        componentId: item.componentId,
        type: item.component.type,
        amount,
        name: item.component.name
      });

      if (item.component.type === 'EARNING') {
        grossEarnings += amount;
      } else if (item.component.type === 'DEDUCTION' || item.component.type === 'EMPLOYEE_CONTRIBUTION') {
        grossDeductions += amount;
      } else if (item.component.type === 'EMPLOYER_CONTRIBUTION') {
        employerContributions += amount;
      }
    }

    // 3. Process Statutory Rules
    const statRules = await prisma.statutoryRule.findMany({
      where: { tenantId, isActive: true }
    });

    for (const rule of statRules) {
      const rateOrAmount = Number(rule.rateOrAmount);
      const cappedAt = rule.cappedAt ? Number(rule.cappedAt) : null;

      if (rule.code === 'PF_EMP' || rule.code === 'PF_INDIA') {
        const basicComponent = lineItems.find(li => li.name.toLowerCase().includes('basic'));
        const basicAmount = basicComponent ? basicComponent.amount : 0;
        
        let pfBase = basicAmount;
        if (cappedAt && pfBase > cappedAt) {
          pfBase = cappedAt;
        }

        const employeeContribution = pfBase * (rateOrAmount / 100);

        if (employeeContribution > 0) {
          lineItems.push({
            type: 'EMPLOYEE_CONTRIBUTION',
            amount: employeeContribution,
            name: rule.name || 'PF Employee Contribution'
          });
          grossDeductions += employeeContribution;
        }
      } else if (rule.code === 'PT_KA' || rule.code === 'PT' || rule.code === 'PT_INDIA') {
        if (grossEarnings > 15000) {
          const ptAmount = rateOrAmount || 200;
          lineItems.push({
            type: 'EMPLOYEE_CONTRIBUTION',
            amount: ptAmount,
            name: rule.name || 'Professional Tax'
          });
          grossDeductions += ptAmount;
        }
      }
    }

    const netPay = grossEarnings - grossDeductions;

    return {
      grossEarnings,
      grossDeductions,
      netPay,
      employerContributions,
      workingDays,
      lopDays,
      lineItems
    };
  }

}
