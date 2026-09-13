import type { Request, Response } from 'express';
import { BudgetCategoriesService } from './budget-categories.service.js';
import { budgetCategorySchema, updateBudgetCategorySchema } from './budget-categories.schema.js';

export async function listHandler(req: Request, res: Response) {
  const data = await BudgetCategoriesService.list(req.tenantId!);
  res.status(200).json({ success: true, data });
}

export async function getHandler(req: Request, res: Response) {
  const data = await BudgetCategoriesService.getById(req.tenantId!, req.params.id as string);
  res.status(200).json({ success: true, data });
}

export async function createHandler(req: Request, res: Response) {
  const body = budgetCategorySchema.parse(req.body);
  const data = await BudgetCategoriesService.create(req.tenantId!, body);
  res.status(201).json({ success: true, data });
}

export async function bulkCreateHandler(req: Request, res: Response) {
  const data = await BudgetCategoriesService.bulkCreate(req.tenantId!, req.body);
  res.status(201).json({ success: true, data });
}

export async function updateHandler(req: Request, res: Response) {
  const body = updateBudgetCategorySchema.parse(req.body);
  const data = await BudgetCategoriesService.update(req.tenantId!, req.params.id as string, body);
  res.status(200).json({ success: true, data });
}

export async function deleteHandler(req: Request, res: Response) {
  await BudgetCategoriesService.delete(req.tenantId!, req.params.id as string);
  res.status(200).json({ success: true, message: 'Budget category deleted' });
}
