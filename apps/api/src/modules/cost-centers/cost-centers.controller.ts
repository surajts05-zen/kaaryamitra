import type { Request, Response } from 'express';
import { CostCentersService } from './cost-centers.service.js';
import { costCenterSchema, updateCostCenterSchema } from './cost-centers.schema.js';

export async function listHandler(req: Request, res: Response) {
  const data = await CostCentersService.list(req.tenantId!);
  res.status(200).json({ success: true, data });
}

export async function getHandler(req: Request, res: Response) {
  const data = await CostCentersService.getById(req.tenantId!, req.params.id as string);
  res.status(200).json({ success: true, data });
}

export async function createHandler(req: Request, res: Response) {
  const body = costCenterSchema.parse(req.body);
  const data = await CostCentersService.create(req.tenantId!, body);
  res.status(201).json({ success: true, data });
}

export async function bulkCreateHandler(req: Request, res: Response) {
  const data = await CostCentersService.bulkCreate(req.tenantId!, req.body);
  res.status(201).json({ success: true, data });
}

export async function updateHandler(req: Request, res: Response) {
  const body = updateCostCenterSchema.parse(req.body);
  const data = await CostCentersService.update(req.tenantId!, req.params.id as string, body);
  res.status(200).json({ success: true, data });
}

export async function deleteHandler(req: Request, res: Response) {
  await CostCentersService.delete(req.tenantId!, req.params.id as string);
  res.status(200).json({ success: true, message: 'Cost center deleted' });
}
