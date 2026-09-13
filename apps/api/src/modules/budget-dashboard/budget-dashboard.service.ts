import { prisma } from '../../lib/prisma.js';

export class BudgetDashboardService {
  static async getOverview(tenantId: string) {
    const projects = await prisma.project.findMany({
      where: { tenantId }
    });

    let totalBudget = 0;
    let actualCost = 0;
    let committedCost = 0;
    let activeProjects = 0;
    
    projects.forEach(p => {
      totalBudget += Number(p.approvedBudget || 0);
      actualCost += Number(p.actualCost || 0);
      committedCost += Number(p.committedCost || 0);
      if (['PLANNING', 'APPROVED', 'ACTIVE'].includes(p.status)) {
        activeProjects++;
      }
    });

    // Recent requests
    const recentRequests = await prisma.budgetRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        project: { select: { name: true } },
      }
    });

    // Recent transactions
    const recentTransactions = await prisma.budgetTransaction.findMany({
      where: { tenantId },
      orderBy: { transactionDate: 'desc' },
      take: 5,
      include: {
        project: { select: { name: true } },
      }
    });

    return {
      kpis: {
        totalBudget,
        actualCost,
        committedCost,
        availableBudget: totalBudget - actualCost - committedCost,
        activeProjects,
        burnRatePct: totalBudget > 0 ? ((actualCost + committedCost) / totalBudget) * 100 : 0
      },
      recentRequests,
      recentTransactions
    };
  }
}
