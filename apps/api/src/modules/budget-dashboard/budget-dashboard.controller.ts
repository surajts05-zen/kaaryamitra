import type { Request, Response } from 'express';
import { BudgetDashboardService } from './budget-dashboard.service.js';

export async function overviewHandler(req: Request, res: Response) {
  const data = await BudgetDashboardService.getOverview(req.tenantId!);
  res.status(200).json({ success: true, data });
}
