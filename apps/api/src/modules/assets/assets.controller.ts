import { Request, Response } from 'express';
import { AssetsService } from './assets.service.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export class AssetsController {
  // ─── Categories ────────────────────────────────────────────────────────────

  static async getCategories(req: Request, res: Response) {
    const categories = await AssetsService.getCategories(req.tenantId!);
    res.json({ data: categories });
  }

  static async createCategory(req: Request, res: Response) {
    const category = await AssetsService.createCategory(req.tenantId!, req.body);
    res.status(201).json({ data: category });
  }

  // ─── Assets ────────────────────────────────────────────────────────────────

  static async getAssets(req: Request, res: Response) {
    const assets = await AssetsService.getAssets(req.tenantId!, req.query);
    res.json({ data: assets });
  }

  static async getAssetById(req: Request, res: Response) {
    const asset = await AssetsService.getAssetById(req.tenantId!, req.params.id as string);
    res.json({ data: asset });
  }

  static async createAsset(req: Request, res: Response) {
    const asset = await AssetsService.createAsset(req.tenantId!, req.body);
    res.status(201).json({ data: asset });
  }

  static async bulkCreateAssets(req: Request, res: Response) {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: { message: 'Items must be an array' } });
    }
    const data = await AssetsService.bulkCreateAssets(req.tenantId!, items);
    res.status(201).json({ success: true, count: data.length, data });
  }

  static async updateAsset(req: Request, res: Response) {
    const asset = await AssetsService.updateAsset(req.tenantId!, req.params.id as string, req.body);
    res.json({ data: asset });
  }

  static async deleteAsset(req: Request, res: Response) {
    await AssetsService.deleteAsset(req.tenantId!, req.params.id as string);
    res.status(204).send();
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  static async assignAsset(req: Request, res: Response) {
    // Current user must be HR/Admin, meaning we need their employee ID for `assignedBy`
    const me = await prisma.employee.findUnique({ where: { userId: req.auth!.userId } });
    if (!me) throw new AppError('Employee profile not found', 404);

    const { employeeId, notes } = req.body;
    const result = await AssetsService.assignAsset(req.tenantId!, req.params.id as string, employeeId, me.id, notes);
    res.json({ data: result });
  }

  static async returnAsset(req: Request, res: Response) {
    const { returnCondition, notes } = req.body;
    const asset = await AssetsService.returnAsset(req.tenantId!, req.params.id as string, returnCondition, notes);
    res.json({ data: asset });
  }

  // ─── ESS ───────────────────────────────────────────────────────────────────

  static async getMyAssets(req: Request, res: Response) {
    const me = await prisma.employee.findUnique({ where: { userId: req.auth!.userId } });
    if (!me) throw new AppError('Employee profile not found', 404);

    const assets = await AssetsService.getEmployeeAssets(req.tenantId!, me.id);
    res.json({ data: assets });
  }

  static async acknowledgeAsset(req: Request, res: Response) {
    const me = await prisma.employee.findUnique({ where: { userId: req.auth!.userId } });
    if (!me) throw new AppError('Employee profile not found', 404);

    const assignment = await AssetsService.acknowledgeAsset(req.tenantId!, req.params.id as string, me.id);
    res.json({ data: assignment });
  }
}
