import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service.js';

export const getDashboardStatsHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const stats = await DashboardService.getDashboardStats(tenantId);
  res.json({ success: true, data: stats });
};
