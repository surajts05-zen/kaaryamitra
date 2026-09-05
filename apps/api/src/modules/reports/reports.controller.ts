import { Request, Response } from 'express';
import { ReportsService } from './reports.service.js';

export class ReportsController {
  static async getMeta(req: Request, res: Response) {
    const meta = await ReportsService.getMeta();
    res.json({ success: true, data: meta });
  }

  static async executeQuery(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const { dataset, config } = req.body;
    
    const data = await ReportsService.executeQuery(tenantId, dataset, config);
    res.json({ success: true, data });
  }

  static async createSavedReport(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const userId = req.auth!.userId;
    
    const report = await ReportsService.saveReport(tenantId, userId, req.body);
    res.json({ success: true, data: report });
  }

  static async getSavedReports(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const reports = await ReportsService.getSavedReports(tenantId);
    res.json({ success: true, data: reports });
  }

  static async getSavedReport(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const report = await ReportsService.getSavedReport(tenantId, id);
    res.json({ success: true, data: report });
  }

  static async updateSavedReport(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const report = await ReportsService.updateSavedReport(tenantId, id, req.body);
    res.json({ success: true, data: report });
  }

  static async deleteSavedReport(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    await ReportsService.deleteSavedReport(tenantId, id);
    res.json({ success: true });
  }
}
